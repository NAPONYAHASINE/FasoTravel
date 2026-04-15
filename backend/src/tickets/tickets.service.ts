import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as QRCode from 'qrcode';
import {
  Ticket,
  TicketTransfer,
  Booking,
  Seat,
  User,
} from '../database/entities';
import {
  TicketStatus,
  TICKET_CODE_LENGTH,
  TICKET_TRANSFER_EXPIRATION_HOURS,
  REFERRAL_CODE_PREFIX,
} from '../common/constants';
import { generateAlphanumericCode } from '../common/utils/code-generator';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  TransferTicketDto,
  CreateSocieteTicketDto,
  UpdateTicketDto,
} from './dto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketTransfer)
    private readonly transferRepo: Repository<TicketTransfer>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Generate tickets when a booking is confirmed.
   * 1 ticket per seat.
   */
  async generateForBooking(booking: Booking): Promise<Ticket[]> {
    const seats = await this.seatRepo.find({
      where: { bookedByBookingId: booking.id },
    });

    const passengers: Array<{
      name: string;
      phone?: string;
      email?: string;
      seatNumber: string;
    }> = Array.isArray(booking.bookingFor)
      ? (booking.bookingFor as Array<Record<string, string>>).map((p, i) => ({
          name: p.name || `Passenger ${i + 1}`,
          phone: p.phone,
          email: p.email,
          seatNumber: p.seatNumber || seats[i]?.seatNumber || `${i + 1}`,
        }))
      : seats.map((s, i) => ({
          name: `Passenger ${i + 1}`,
          seatNumber: s.seatNumber,
        }));

    const tickets: Ticket[] = [];

    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const passenger = passengers[i] || {
        name: `Passenger ${i + 1}`,
        seatNumber: seat.seatNumber,
      };

      const ticketId = this.generateTicketId();
      const alphanumericCode = this.generateAlphanumericCode();

      const qrData = JSON.stringify({
        ticketId,
        bookingId: booking.id,
        tripId: booking.tripId,
        seatNumber: seat.seatNumber,
      });
      const qrCode = await QRCode.toDataURL(qrData);

      const ticket = this.ticketRepo.create({
        id: ticketId,
        bundleId: booking.id,
        tripId: booking.tripId,
        bookingId: booking.id,
        operatorId: booking.operatorId,
        passengerName: passenger.name,
        passengerPhone: passenger.phone,
        passengerEmail: passenger.email,
        seatNumber: seat.seatNumber,
        status: TicketStatus.ACTIVE,
        qrCode,
        alphanumericCode,
        price: Math.round(booking.totalAmount / seats.length),
        purchasedByUserId: booking.userId,
        purchasedAt: new Date(),
      });

      tickets.push(await this.ticketRepo.save(ticket));
    }

    return tickets;
  }

  async findMyTickets(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Ticket>> {
    const [data, total] = await this.ticketRepo.findAndCount({
      where: { purchasedByUserId: userId },
      relations: ['trip'],
      order: { purchasedAt: 'DESC' },
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

  async findOne(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['trip', 'booking'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    return ticket;
  }

  async downloadTicket(ticketId: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['trip', 'booking'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const qrData = JSON.stringify({
      id: ticket.id,
      code: ticket.alphanumericCode,
      passenger: ticket.passengerName,
      status: ticket.status,
    });

    const qrCodeBase64 = await QRCode.toDataURL(qrData);

    return {
      ticket,
      qrCode: qrCodeBase64,
    };
  }

  async verifyByCode(code: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { alphanumericCode: code },
      relations: ['trip'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with code ${code} not found`);
    }
    return ticket;
  }

  /**
   * Auto-consume tickets whose trip departure time has passed.
   * Rule: if the ticket is ACTIVE and the trip has departed, the ticket is CONSUMED.
   * Runs every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async consumeDepartedTickets(): Promise<void> {
    const now = new Date();

    // Find all ACTIVE tickets whose trip has already departed
    const activeTickets = await this.ticketRepo.find({
      where: { status: TicketStatus.ACTIVE as string },
      relations: ['trip'],
    });

    const toConsume = activeTickets.filter((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const dep = t.trip?.departureTime as Date | undefined;
      return dep && new Date(dep) <= now;
    });

    if (toConsume.length === 0) return;

    for (const ticket of toConsume) {
      ticket.status = TicketStatus.BOARDED;
      ticket.boardedAt = now;
    }

    await this.ticketRepo.save(toConsume);
    this.logger.log(`Auto-consumed ${toConsume.length} ticket(s)`);
  }

  /**
   * Transfer a ticket to another user.
   */
  async transfer(
    ticketId: string,
    userId: string,
    dto: TransferTicketDto,
  ): Promise<TicketTransfer> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (ticket.purchasedByUserId !== userId) {
      throw new BadRequestException('You can only transfer your own tickets');
    }

    if (ticket.status !== (TicketStatus.ACTIVE as string)) {
      throw new BadRequestException(
        `Ticket status is ${ticket.status}, cannot transfer`,
      );
    }

    if (ticket.isTransferred) {
      throw new ConflictException('Ticket has already been transferred');
    }

    // Find recipient by phone
    const recipient = await this.userRepo.findOne({
      where: { phoneNumber: dto.recipientPhone },
    });

    const transferToken = this.generateTransferToken();
    const expiresAt = new Date(
      Date.now() + TICKET_TRANSFER_EXPIRATION_HOURS * 60 * 60 * 1000,
    );

    const transfer = this.transferRepo.create({
      ticketId,
      fromUserId: userId,
      toUserId: recipient?.id,
      status: 'PENDING',
      transferToken,
      expiresAt,
    });

    const savedTransfer = await this.transferRepo.save(transfer);

    // Mark ticket as transferred
    ticket.isTransferred = true;
    if (recipient) {
      ticket.purchasedByUserId = recipient.id;
      ticket.passengerName =
        dto.recipientName || recipient.name || ticket.passengerName;
    }
    await this.ticketRepo.save(ticket);

    return savedTransfer;
  }

  async cancelTicket(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (ticket.purchasedByUserId !== userId) {
      throw new BadRequestException('You can only cancel your own tickets');
    }

    if (ticket.status !== (TicketStatus.ACTIVE as string)) {
      throw new BadRequestException(
        `Ticket status is ${ticket.status}, cannot cancel`,
      );
    }

    if (!ticket.canCancel) {
      throw new BadRequestException('This ticket cannot be cancelled');
    }

    ticket.status = TicketStatus.CANCELLED;
    ticket.cancelledAt = new Date();
    return this.ticketRepo.save(ticket);
  }

  async refundTicket(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (ticket.purchasedByUserId !== userId) {
      throw new BadRequestException('You can only refund your own tickets');
    }

    if (ticket.status !== (TicketStatus.CANCELLED as string)) {
      throw new BadRequestException(
        `Ticket must be cancelled before refund, current status: ${ticket.status}`,
      );
    }

    ticket.status = TicketStatus.REFUNDED;
    return this.ticketRepo.save(ticket);
  }

  // ─── Private helpers ───

  private generateTicketId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  private generateAlphanumericCode(): string {
    return generateAlphanumericCode(
      TICKET_CODE_LENGTH,
      `${REFERRAL_CODE_PREFIX}-`,
    );
  }

  private generateTransferToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // ─── Societe: Create counter ticket ───

  async createSocieteTicket(dto: CreateSocieteTicketDto): Promise<Ticket> {
    const ticketId = this.generateTicketId();
    const alphanumericCode = this.generateAlphanumericCode();
    const qrData = JSON.stringify({
      ticketId,
      tripId: dto.tripId,
      seatNumber: dto.seatNumber,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const ticket = this.ticketRepo.create({
      id: ticketId,
      tripId: dto.tripId,
      operatorId: dto.operatorId ?? '',
      passengerName: dto.passengerName,
      passengerPhone: dto.passengerPhone,
      passengerEmail: dto.passengerEmail,
      seatNumber: dto.seatNumber,
      price: dto.price,
      paymentMethod: dto.paymentMethod ?? 'cash',
      status: TicketStatus.ACTIVE,
      qrCode,
      alphanumericCode,
      salesChannel: dto.salesChannel ?? 'guichet',
      cashierId: dto.cashierId,
      cashierName: dto.cashierName,
      gareId: dto.gareId,
      purchasedAt: new Date(),
    });
    return this.ticketRepo.save(ticket);
  }

  async updateTicket(ticketId: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    if (dto.passengerName) ticket.passengerName = dto.passengerName;
    if (dto.passengerPhone) ticket.passengerPhone = dto.passengerPhone;
    if (dto.seatNumber) ticket.seatNumber = dto.seatNumber;
    if (dto.status) ticket.status = dto.status;
    if (dto.price) ticket.price = dto.price;

    return this.ticketRepo.save(ticket);
  }

  // ─── ADMIN ───

  async findAllAdmin(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Ticket>> {
    const [data, total] = await this.ticketRepo.findAndCount({
      relations: ['trip'],
      order: { purchasedAt: 'DESC' },
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

  async findOneAdmin(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['trip', 'booking'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    return ticket;
  }

  async getAdminStats() {
    const total = await this.ticketRepo.count();
    const active = await this.ticketRepo.count({
      where: { status: TicketStatus.ACTIVE },
    });
    return { total, active };
  }
}
