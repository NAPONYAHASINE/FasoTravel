import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In, EntityManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Booking,
  Seat,
  Trip,
  BookingSegment,
  Segment,
} from '../database/entities';
import {
  BookingStatus,
  SeatStatus,
  BOOKING_HOLD_MINUTES,
} from '../common/constants';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateBookingDto } from './dto';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(BookingSegment)
    private readonly bookingSegmentRepo: Repository<BookingSegment>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
  ) {}

  /**
   * Create a booking with HOLD status.
   * If the trip has segments, uses per-segment seat locking.
   * Otherwise, falls back to trip-level seat locking.
   */
  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    // Validate: either seatNumbers or numSeats must be provided
    if (!dto.seatNumbers?.length && !dto.numSeats) {
      throw new BadRequestException(
        'Either seatNumbers or numSeats is required',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Verify trip exists and is not cancelled
      const trip = await manager.findOne(Trip, {
        where: { id: dto.tripId },
      });
      if (!trip || trip.status === 'cancelled') {
        throw new NotFoundException(
          `Trip ${dto.tripId} not found or is cancelled`,
        );
      }

      // 2. If only numSeats is provided, auto-assign available seats
      if (!dto.seatNumbers?.length && dto.numSeats) {
        const available = await manager
          .createQueryBuilder(Seat, 's')
          .where('s.trip_id = :tripId', { tripId: dto.tripId })
          .andWhere('s.status = :status', { status: SeatStatus.AVAILABLE })
          .orderBy('s.seat_number', 'ASC')
          .take(dto.numSeats)
          .getMany();

        if (available.length < dto.numSeats) {
          throw new ConflictException(
            `Only ${available.length} seats available, requested ${dto.numSeats}`,
          );
        }
        dto.seatNumbers = available.map((s) => s.seatNumber);
      }

      // At this point seatNumbers is guaranteed to be populated
      const seatNumbers = dto.seatNumbers!;

      // 3. Determine boarding/alighting stations
      const boardingId = dto.boardingStationId || trip.fromStationId;
      const alightingId = dto.alightingStationId || trip.toStationId;

      // 3. Check for segments on this trip
      const segments = await manager.find(Segment, {
        where: { tripId: dto.tripId },
        order: { sequenceNumber: 'ASC' },
      });

      if (segments.length > 0) {
        return this.createWithSegments(
          manager,
          userId,
          dto,
          seatNumbers,
          trip,
          segments,
          boardingId,
          alightingId,
        );
      }

      return this.createWithoutSegments(
        manager,
        userId,
        dto,
        seatNumbers,
        trip,
        boardingId,
        alightingId,
      );
    });
  }

  // ─── Segment-based booking ───

  private async createWithSegments(
    manager: EntityManager,
    userId: string,
    dto: CreateBookingDto,
    seatNumbers: string[],
    trip: Trip,
    segments: Segment[],
    boardingId: string,
    alightingId: string,
  ): Promise<Booking> {
    // Determine affected segment range
    const firstIdx = segments.findIndex((s) => s.fromStopId === boardingId);
    const lastIdx = segments.findIndex((s) => s.toStopId === alightingId);

    if (firstIdx === -1 || lastIdx === -1 || firstIdx > lastIdx) {
      throw new BadRequestException(
        'Invalid boarding/alighting station for this trip',
      );
    }

    const affectedSegments = segments.slice(firstIdx, lastIdx + 1);

    // Lock seats (trip-level row lock prevents concurrent bookings)
    const seats = await manager
      .createQueryBuilder(Seat, 's')
      .setLock('pessimistic_write')
      .where('s.trip_id = :tripId', { tripId: dto.tripId })
      .andWhere('s.seat_number IN (:...seatNumbers)', {
        seatNumbers,
      })
      .getMany();

    if (seats.length !== seatNumbers.length) {
      const found = seats.map((s) => s.seatNumber);
      const missing = seatNumbers.filter((sn) => !found.includes(sn));
      throw new NotFoundException(`Seats not found: ${missing.join(', ')}`);
    }

    // Check per-segment availability via BookingSegment
    const seatIds = seats.map((s) => s.id);
    const segmentIds = affectedSegments.map((s) => s.segmentId);

    const conflicts = await manager
      .createQueryBuilder(BookingSegment, 'bs')
      .innerJoin('bs.booking', 'b')
      .where('bs.seat_id IN (:...seatIds)', { seatIds })
      .andWhere('bs.segment_id IN (:...segmentIds)', { segmentIds })
      .andWhere('b.status IN (:...activeStatuses)', {
        activeStatuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      })
      .getMany();

    if (conflicts.length > 0) {
      const conflictSeatIds = [...new Set(conflicts.map((c) => c.seatId))];
      const conflictSeats = seats.filter((s) => conflictSeatIds.includes(s.id));
      throw new ConflictException(
        `Seats already taken for requested segments: ${conflictSeats.map((s) => s.seatNumber).join(', ')}`,
      );
    }

    // Calculate price from segment base prices (or use mobile-provided unitPrice)
    let unitPrice: number;
    if (dto.unitPrice != null) {
      unitPrice = dto.unitPrice;
    } else {
      const segmentTotal = affectedSegments.reduce(
        (sum, s) => sum + s.basePrice,
        0,
      );
      unitPrice = segmentTotal > 0 ? segmentTotal : trip.basePrice;
    }
    const totalAmount = unitPrice * seatNumbers.length;
    const holdExpiresAt = new Date(
      Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000,
    );

    // Create booking
    const bookingData: Partial<Booking> = {
      userId,
      tripId: dto.tripId,
      operatorId: trip.operatorId,
      status: BookingStatus.PENDING,
      totalAmount,
      currency: trip.currency,
      numPassengers: seatNumbers.length,
      holdExpiresAt,
      boardingStationId: boardingId,
      alightingStationId: alightingId,
      fromSegmentId: affectedSegments[0].segmentId,
      toSegmentId: affectedSegments[affectedSegments.length - 1].segmentId,
      selectedServices: dto.selectedServices,
    };

    if (dto.passengers) {
      bookingData.bookingFor = dto.passengers.map((p, i) => ({
        ...p,
        seatNumber: seatNumbers[i],
      })) as unknown as Record<string, any>;
    } else if (dto.passengerName || dto.passengerPhone) {
      bookingData.bookingFor = {
        name: dto.passengerName,
        phone: dto.passengerPhone,
      } as unknown as Record<string, any>;
    }

    const booking = manager.create(Booking, bookingData);
    const savedBooking = await manager.save(Booking, booking);

    // Create BookingSegment records for each (seat × segment)
    const bsRecords: BookingSegment[] = [];
    for (const seat of seats) {
      for (const segment of affectedSegments) {
        bsRecords.push(
          manager.create(BookingSegment, {
            bookingId: savedBooking.id,
            segmentId: segment.segmentId,
            seatId: seat.id,
          }),
        );
      }
    }
    await manager.save(BookingSegment, bsRecords);

    // Decrement per-segment available seats
    for (const segment of affectedSegments) {
      segment.availableSeats = Math.max(
        0,
        segment.availableSeats - seatNumbers.length,
      );
    }
    await manager.save(Segment, affectedSegments);

    return savedBooking;
  }

  // ─── Trip-level booking (fallback when no segments) ───

  private async createWithoutSegments(
    manager: EntityManager,
    userId: string,
    dto: CreateBookingDto,
    seatNumbers: string[],
    trip: Trip,
    boardingId: string,
    alightingId: string,
  ): Promise<Booking> {
    const seats = await manager
      .createQueryBuilder(Seat, 's')
      .setLock('pessimistic_write')
      .where('s.trip_id = :tripId', { tripId: dto.tripId })
      .andWhere('s.seat_number IN (:...seatNumbers)', {
        seatNumbers,
      })
      .getMany();

    if (seats.length !== seatNumbers.length) {
      const found = seats.map((s) => s.seatNumber);
      const missing = seatNumbers.filter((sn) => !found.includes(sn));
      throw new NotFoundException(`Seats not found: ${missing.join(', ')}`);
    }

    const unavailable = seats.filter(
      (s) => s.status !== (SeatStatus.AVAILABLE as string),
    );
    if (unavailable.length > 0) {
      throw new ConflictException(
        `Seats already taken: ${unavailable.map((s) => s.seatNumber).join(', ')}`,
      );
    }

    const unitPrice = dto.unitPrice ?? trip.basePrice;
    const totalAmount = unitPrice * seatNumbers.length;
    const holdExpiresAt = new Date(
      Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000,
    );

    const bookingData: Partial<Booking> = {
      userId,
      tripId: dto.tripId,
      operatorId: trip.operatorId,
      status: BookingStatus.PENDING,
      totalAmount,
      currency: trip.currency,
      numPassengers: seatNumbers.length,
      holdExpiresAt,
      boardingStationId: boardingId,
      alightingStationId: alightingId,
      selectedServices: dto.selectedServices,
    };

    if (dto.passengers) {
      bookingData.bookingFor = dto.passengers.map((p, i) => ({
        ...p,
        seatNumber: seatNumbers[i],
      })) as unknown as Record<string, any>;
    } else if (dto.passengerName || dto.passengerPhone) {
      bookingData.bookingFor = {
        name: dto.passengerName,
        phone: dto.passengerPhone,
      } as unknown as Record<string, any>;
    }

    const booking = manager.create(Booking, bookingData);
    const savedBooking = await manager.save(Booking, booking);

    // Mark seats as HELD
    for (const seat of seats) {
      seat.status = SeatStatus.HELD;
      seat.bookedByUserId = userId;
      seat.bookedByBookingId = savedBooking.id;
      seat.holdExpiresAt = holdExpiresAt;
    }
    await manager.save(Seat, seats);

    // Update trip available seats
    trip.availableSeats = Math.max(0, trip.availableSeats - seatNumbers.length);
    await manager.save(Trip, trip);

    return savedBooking;
  }

  /**
   * Confirm booking — called after payment success
   */
  async confirm(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== (BookingStatus.PENDING as string)) {
      throw new BadRequestException(
        `Booking is ${booking.status}, cannot confirm`,
      );
    }

    if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
      throw new BadRequestException('Booking hold has expired');
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.holdExpiresAt = null as unknown as Date;

    // For trip-level bookings update seat status; segment bookings
    // are tracked entirely via BookingSegment records.
    const segCount = await this.bookingSegmentRepo.count({
      where: { bookingId },
    });
    if (segCount === 0) {
      await this.seatRepo.update(
        { bookedByBookingId: bookingId },
        { status: SeatStatus.BOOKED, holdExpiresAt: null as unknown as Date },
      );
    }

    const confirmedBooking = await this.bookingRepo.save(booking);

    // Auto-generate tickets (1 per seat)
    await this.ticketsService.generateForBooking(confirmedBooking);

    return confirmedBooking;
  }

  /**
   * Cancel booking — releases seats (segment or trip level)
   */
  async cancel(bookingId: string, userId: string): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId, userId },
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      if (booking.status === (BookingStatus.CANCELLED as string)) {
        throw new BadRequestException(`Booking is already ${booking.status}`);
      }

      // Check if segment-based booking
      const bsRecords = await manager.find(BookingSegment, {
        where: { bookingId },
      });

      if (bsRecords.length > 0) {
        // Segment-based: restore per-segment available seats
        const segmentIds = [...new Set(bsRecords.map((bs) => bs.segmentId))];
        const segments = await manager.find(Segment, {
          where: { segmentId: In(segmentIds) },
        });

        for (const seg of segments) {
          const seatsInSeg = bsRecords.filter(
            (bs) => bs.segmentId === seg.segmentId,
          ).length;
          seg.availableSeats += seatsInSeg;
        }
        await manager.save(Segment, segments);
        await manager.remove(BookingSegment, bsRecords);
      } else {
        // Trip-level: release seats and restore trip count
        const seats = await manager.find(Seat, {
          where: { bookedByBookingId: bookingId },
        });

        for (const seat of seats) {
          seat.status = SeatStatus.AVAILABLE;
          seat.bookedByUserId = null as unknown as string;
          seat.bookedByBookingId = null as unknown as string;
          seat.holdExpiresAt = null as unknown as Date;
        }
        await manager.save(Seat, seats);

        const trip = await manager.findOne(Trip, {
          where: { id: booking.tripId },
        });
        if (trip) {
          trip.availableSeats += seats.length;
          await manager.save(Trip, trip);
        }
      }

      booking.status = BookingStatus.CANCELLED;
      return manager.save(Booking, booking);
    });
  }

  async findMyBookings(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Booking>> {
    const [data, total] = await this.bookingRepo.findAndCount({
      where: { userId },
      relations: ['trip'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
      relations: ['trip', 'tickets'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    return booking;
  }

  // ─── ADMIN ───

  async findAllAdmin(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Booking>> {
    const [data, total] = await this.bookingRepo.findAndCount({
      relations: ['trip'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOneAdmin(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['trip', 'tickets'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    return booking;
  }

  async getAdminStats() {
    const total = await this.bookingRepo.count();
    const pending = await this.bookingRepo.count({
      where: { status: BookingStatus.PENDING },
    });
    const confirmed = await this.bookingRepo.count({
      where: { status: BookingStatus.CONFIRMED },
    });
    const cancelled = await this.bookingRepo.count({
      where: { status: BookingStatus.CANCELLED },
    });
    return { total, pending, confirmed, cancelled };
  }

  /**
   * CRON: Expire PENDING bookings older than BOOKING_HOLD_MINUTES.
   * Handles both segment-based and trip-level bookings.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expireHolds(): Promise<void> {
    const expiredBookings = await this.bookingRepo.find({
      where: {
        status: BookingStatus.PENDING,
        holdExpiresAt: LessThan(new Date()),
      },
    });

    if (expiredBookings.length === 0) return;

    this.logger.log(`Expiring ${expiredBookings.length} held booking(s)...`);

    for (const booking of expiredBookings) {
      await this.dataSource.transaction(async (manager) => {
        const bsRecords = await manager.find(BookingSegment, {
          where: { bookingId: booking.id },
        });

        if (bsRecords.length > 0) {
          // Segment-based: restore per-segment available seats
          const segmentIds = [...new Set(bsRecords.map((bs) => bs.segmentId))];
          const segments = await manager.find(Segment, {
            where: { segmentId: In(segmentIds) },
          });

          for (const seg of segments) {
            const seatsInSeg = bsRecords.filter(
              (bs) => bs.segmentId === seg.segmentId,
            ).length;
            seg.availableSeats += seatsInSeg;
          }
          await manager.save(Segment, segments);
          await manager.remove(BookingSegment, bsRecords);
        } else {
          // Trip-level: release seats
          const seats = await manager.find(Seat, {
            where: { bookedByBookingId: booking.id },
          });

          for (const seat of seats) {
            seat.status = SeatStatus.AVAILABLE;
            seat.bookedByUserId = null as unknown as string;
            seat.bookedByBookingId = null as unknown as string;
            seat.holdExpiresAt = null as unknown as Date;
          }
          await manager.save(Seat, seats);

          const trip = await manager.findOne(Trip, {
            where: { id: booking.tripId },
          });
          if (trip) {
            trip.availableSeats += seats.length;
            await manager.save(Trip, trip);
          }
        }

        booking.status = BookingStatus.CANCELLED;
        await manager.save(Booking, booking);
      });
    }

    this.logger.log(
      `Expired ${expiredBookings.length} booking(s) and released seats`,
    );
  }
}
