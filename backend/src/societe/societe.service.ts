import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  UserOperatorRole,
  Route,
  TripSchedule,
  Trip,
  Ticket,
  PriceSegment,
  PriceHistory,
  CashTransaction,
} from '../database/entities';
import { UserRole } from '../common/constants';
import { generateAlphanumericCode } from '../common/utils/code-generator';
import {
  CreateStaffDto,
  UpdateStaffDto,
  TripQueryDto,
  TicketQueryDto,
  CashTransactionQueryDto,
  CreateCashSaleDto,
  CreateCashTransactionDto,
  CreateRouteDto,
  UpdateRouteDto,
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
  UpdateTicketDto,
} from './dto';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SocieteService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserOperatorRole)
    private readonly roleRepo: Repository<UserOperatorRole>,
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
    @InjectRepository(TripSchedule)
    private readonly scheduleRepo: Repository<TripSchedule>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(PriceSegment)
    private readonly priceSegmentRepo: Repository<PriceSegment>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepo: Repository<PriceHistory>,
    @InjectRepository(CashTransaction)
    private readonly cashTxRepo: Repository<CashTransaction>,
  ) {}

  // ══════════ MANAGERS ══════════

  async getManagers(operatorId: string) {
    const roles = await this.roleRepo.find({
      where: { operatorId, role: UserRole.MANAGER, isActive: true },
      relations: ['user'],
    });
    return roles.map((r) => this.toStaffDto(r));
  }

  async getManagerById(operatorId: string, id: string) {
    const role = await this.roleRepo.findOne({
      where: { userId: id, operatorId, role: UserRole.MANAGER },
      relations: ['user'],
    });
    if (!role) throw new NotFoundException('Manager not found');
    return this.toStaffDto(role);
  }

  async createManager(operatorId: string, dto: CreateStaffDto) {
    return this.createStaff(operatorId, dto, UserRole.MANAGER);
  }

  async updateManager(operatorId: string, id: string, dto: UpdateStaffDto) {
    return this.updateStaff(operatorId, id, UserRole.MANAGER, dto);
  }

  async deleteManager(operatorId: string, id: string) {
    return this.removeStaff(operatorId, id, UserRole.MANAGER);
  }

  // ══════════ CASHIERS ══════════

  async getCashiers(operatorId: string) {
    const roles = await this.roleRepo.find({
      where: { operatorId, role: UserRole.CAISSIER, isActive: true },
      relations: ['user'],
    });
    return roles.map((r) => this.toStaffDto(r));
  }

  async getCashierById(operatorId: string, id: string) {
    const role = await this.roleRepo.findOne({
      where: { userId: id, operatorId, role: UserRole.CAISSIER },
      relations: ['user'],
    });
    if (!role) throw new NotFoundException('Cashier not found');
    return this.toStaffDto(role);
  }

  async createCashier(operatorId: string, dto: CreateStaffDto) {
    return this.createStaff(operatorId, dto, UserRole.CAISSIER);
  }

  async updateCashier(operatorId: string, id: string, dto: UpdateStaffDto) {
    return this.updateStaff(operatorId, id, UserRole.CAISSIER, dto);
  }

  async deleteCashier(operatorId: string, id: string) {
    return this.removeStaff(operatorId, id, UserRole.CAISSIER);
  }

  // ══════════ ROUTES ══════════

  async getRoutes(operatorId: string) {
    return this.routeRepo.find({
      where: { fromStation: { id: operatorId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getRouteById(id: string) {
    const route = await this.routeRepo.findOneBy({ id });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async createRoute(dto: CreateRouteDto) {
    const id = `route-${randomUUID().slice(0, 8)}`;
    const route = this.routeRepo.create({ id, ...dto });
    return this.routeRepo.save(route);
  }

  async updateRoute(id: string, dto: UpdateRouteDto) {
    const route = await this.getRouteById(id);
    Object.assign(route, dto);
    return this.routeRepo.save(route);
  }

  async deleteRoute(id: string) {
    const route = await this.getRouteById(id);
    await this.routeRepo.remove(route);
  }

  // ══════════ SCHEDULE TEMPLATES ══════════

  async getScheduleTemplates(operatorId: string) {
    return this.scheduleRepo.find({
      where: { operatorId },
      order: { departureTime: 'ASC' },
    });
  }

  async getScheduleTemplateById(id: string) {
    const t = await this.scheduleRepo.findOneBy({ scheduleId: id });
    if (!t) throw new NotFoundException('Schedule template not found');
    return t;
  }

  async createScheduleTemplate(
    operatorId: string,
    dto: CreateScheduleTemplateDto,
  ) {
    const template = this.scheduleRepo.create({ operatorId, ...dto });
    return this.scheduleRepo.save(template);
  }

  async updateScheduleTemplate(id: string, dto: UpdateScheduleTemplateDto) {
    const t = await this.getScheduleTemplateById(id);
    Object.assign(t, dto);
    return this.scheduleRepo.save(t);
  }

  async deleteScheduleTemplate(id: string) {
    const t = await this.getScheduleTemplateById(id);
    await this.scheduleRepo.remove(t);
  }

  // ══════════ TRIPS (societe-scoped) ══════════

  async getTrips(operatorId: string, query: TripQueryDto) {
    const qb = this.tripRepo.createQueryBuilder('t');
    qb.where('t.operator_id = :operatorId', { operatorId });

    if (query.routeId) {
      qb.andWhere('t.route_id = :routeId', { routeId: query.routeId });
    }
    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.dateFrom) {
      qb.andWhere('t.departure_date >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }
    if (query.dateTo) {
      qb.andWhere('t.departure_date <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('t.departure_time', 'DESC');
    return qb.getMany();
  }

  async generateTripsFromTemplates(operatorId: string, body: { date: string }) {
    const templates = await this.scheduleRepo.find({
      where: { operatorId },
    });
    const generated: Trip[] = [];
    for (const tmpl of templates) {
      const depDate = new Date(`${body.date}T${tmpl.departureTime}`);
      const arrDate = new Date(
        depDate.getTime() + (tmpl.durationMinutes ?? 180) * 60_000,
      );
      const trip = this.tripRepo.create({
        id: `trip-${randomUUID().slice(0, 8)}`,
        operatorId,
        routeId: `${tmpl.fromStopId}-${tmpl.toStopId}`,
        fromStationId: tmpl.fromStopId,
        toStationId: tmpl.toStopId,
        departureTime: depDate,
        arrivalTime: arrDate,
        basePrice: tmpl.basePrice,
        durationMinutes: tmpl.durationMinutes,
        status: 'scheduled',
        vehicleId: tmpl.vehicleId,
        availableSeats: 50,
        totalSeats: 50,
      });
      generated.push(trip);
    }
    if (generated.length > 0) {
      await this.tripRepo.save(generated);
    }
    return { generated: generated.length, date: body.date };
  }

  // ══════════ TICKETS (societe sell/manage) ══════════

  async createTicketCashSale(
    operatorId: string,
    cashierId: string,
    dto: CreateCashSaleDto,
  ) {
    const ticketId = this.generateTicketCode();
    const ticket = this.ticketRepo.create({
      id: `TKT-${ticketId}`,
      tripId: dto.tripId,
      operatorId,
      passengerName: dto.passengerName,
      passengerPhone: dto.passengerPhone,
      seatNumber: dto.seatNumber,
      price: dto.price,
      currency: 'XOF',
      status: 'confirmed',
      salesChannel: 'guichet',
      alphanumericCode: ticketId,
      cashierId,
      purchasedAt: new Date(),
    });
    const saved = await this.ticketRepo.save(ticket);

    // Record cash transaction
    const tx = this.cashTxRepo.create({
      operatorId,
      cashierId,
      ticketId: saved.id,
      type: 'sale',
      amount: dto.price,
      paymentMethod: dto.paymentMethod ?? 'cash',
    });
    await this.cashTxRepo.save(tx);

    return saved;
  }

  async getSocieteTickets(operatorId: string, query: TicketQueryDto) {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoin('t.trip', 'trip')
      .where('trip.operator_id = :operatorId', { operatorId });

    if (query.tripId) {
      qb.andWhere('t.trip_id = :tripId', { tripId: query.tripId });
    }
    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.salesChannel) {
      qb.andWhere('t.sales_channel = :ch', { ch: query.salesChannel });
    }
    if (query.dateFrom) {
      qb.andWhere('t.issued_at >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('t.issued_at <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('t.issued_at', 'DESC');
    return qb.getMany();
  }

  async updateTicket(id: string, dto: UpdateTicketDto) {
    const ticket = await this.ticketRepo.findOneBy({ id });
    if (!ticket) throw new NotFoundException('Ticket not found');
    Object.assign(ticket, dto);
    return this.ticketRepo.save(ticket);
  }

  async cancelTicket(id: string, _reason?: string) {
    const ticket = await this.ticketRepo.findOneBy({ id });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'cancelled';
    return this.ticketRepo.save(ticket);
  }

  async refundTicket(
    id: string,
    operatorId: string,
    amount: number,
    cashierId?: string,
  ) {
    const ticket = await this.ticketRepo.findOneBy({ id });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'refunded';
    await this.ticketRepo.save(ticket);

    const tx = this.cashTxRepo.create({
      operatorId,
      cashierId: cashierId ?? '',
      ticketId: id,
      type: 'refund',
      amount: -amount,
      paymentMethod: 'cash',
    });
    await this.cashTxRepo.save(tx);

    return ticket;
  }

  // ══════════ PRICE SEGMENTS ══════════

  async getPriceSegments(operatorId: string) {
    return this.priceSegmentRepo.find({
      where: { operatorId, isActive: true },
      order: { label: 'ASC' },
    });
  }

  async updatePriceSegment(
    segmentId: string,
    newPrice: number,
    changedBy?: string,
  ) {
    const seg = await this.priceSegmentRepo.findOneBy({ id: segmentId });
    if (!seg) throw new NotFoundException('Price segment not found');

    // Record history
    const history = this.priceHistoryRepo.create({
      segmentId,
      oldPrice: seg.price,
      newPrice,
      changedBy,
    });
    await this.priceHistoryRepo.save(history);

    seg.price = newPrice;
    return this.priceSegmentRepo.save(seg);
  }

  async getPriceHistory(segmentId: string) {
    return this.priceHistoryRepo.find({
      where: { segmentId },
      order: { changedAt: 'DESC' },
    });
  }

  // ══════════ CASH TRANSACTIONS ══════════

  async getCashTransactions(
    operatorId: string,
    query: CashTransactionQueryDto,
  ) {
    const qb = this.cashTxRepo.createQueryBuilder('ct');
    qb.where('ct.operator_id = :operatorId', { operatorId });

    if (query.cashierId) {
      qb.andWhere('ct.cashier_id = :cid', { cid: query.cashierId });
    }
    if (query.type) {
      qb.andWhere('ct.type = :type', { type: query.type });
    }
    if (query.dateFrom) {
      qb.andWhere('ct.created_at >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('ct.created_at <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('ct.created_at', 'DESC');
    return qb.getMany();
  }

  async createCashTransaction(
    operatorId: string,
    cashierId: string,
    dto: CreateCashTransactionDto,
  ) {
    const tx = this.cashTxRepo.create({
      operatorId,
      cashierId,
      type: dto.type ?? 'adjustment',
      amount: dto.amount,
      paymentMethod: dto.paymentMethod ?? 'cash',
      notes: dto.notes,
      stationId: dto.stationId,
    });
    return this.cashTxRepo.save(tx);
  }

  // ══════════ HELPERS ══════════

  private async createStaff(
    operatorId: string,
    dto: CreateStaffDto,
    role: string,
  ) {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) {
      // Check if already assigned
      const existingRole = await this.roleRepo.findOneBy({
        userId: existing.id,
        operatorId,
        role,
      });
      if (existingRole) {
        throw new BadRequestException('Staff member already exists');
      }
      // Assign new role
      const newRole = this.roleRepo.create({
        userId: existing.id,
        operatorId,
        role,
        isActive: true,
      });
      await this.roleRepo.save(newRole);
      return this.toStaffDto({ ...newRole, user: existing });
    }

    // Create new user
    const password = dto.password ?? 'FasoTravel2026!';
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      phoneNumber: dto.whatsapp,
      firstName: dto.firstName,
      lastName: dto.lastName,
      name: `${dto.firstName} ${dto.lastName}`,
      passwordHash: hash,
      role,
      isVerified: true,
    });
    const saved = await this.userRepo.save(user);

    const userRole = this.roleRepo.create({
      userId: saved.id,
      operatorId,
      role,
      isActive: true,
    });
    await this.roleRepo.save(userRole);

    return this.toStaffDto({ ...userRole, user: saved });
  }

  private async updateStaff(
    operatorId: string,
    userId: string,
    role: string,
    dto: UpdateStaffDto,
  ) {
    const staffRole = await this.roleRepo.findOne({
      where: { userId, operatorId, role },
      relations: ['user'],
    });
    if (!staffRole) throw new NotFoundException('Staff member not found');

    const user = staffRole.user;
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.email) user.email = dto.email;
    if (dto.whatsapp) user.phoneNumber = dto.whatsapp;
    if (dto.firstName || dto.lastName) {
      user.name = `${dto.firstName ?? user.firstName} ${dto.lastName ?? user.lastName}`;
    }
    if (dto.status) user.status = dto.status;

    await this.userRepo.save(user);
    return this.toStaffDto({ ...staffRole, user });
  }

  private async removeStaff(operatorId: string, userId: string, role: string) {
    const staffRole = await this.roleRepo.findOne({
      where: { userId, operatorId, role },
    });
    if (!staffRole) throw new NotFoundException('Staff member not found');
    staffRole.isActive = false;
    await this.roleRepo.save(staffRole);
  }

  private toStaffDto(role: UserOperatorRole) {
    const user = role.user;
    return {
      id: user?.id ?? role.userId,
      firstName: user?.firstName,
      lastName: user?.lastName,
      name: user?.name,
      email: user?.email,
      whatsapp: user?.phoneNumber,
      role: role.role,
      status: user?.status ?? 'active',
      assignedAt: role.assignedAt,
      isActive: role.isActive,
    };
  }

  private generateTicketCode(): string {
    return generateAlphanumericCode(8);
  }
}
