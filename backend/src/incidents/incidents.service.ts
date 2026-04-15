import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident, Trip, Ticket } from '../database/entities';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  ResolveIncidentDto,
  NotifyPassengersDto,
} from './dto';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  // ---- CRUD ----

  /**
   * Create a new incident (reported by passenger or operator).
   * Frontend: POST /incidents
   */
  async create(dto: CreateIncidentDto, reportedBy?: string): Promise<Incident> {
    // Validate trip exists
    const trip = await this.tripRepo.findOne({
      where: { id: dto.trip_id },
      relations: ['fromStation', 'toStation'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip ${dto.trip_id} not found`);
    }

    const incident = this.incidentRepo.create({
      tripId: dto.trip_id,
      tripRoute:
        trip.fromStationName && trip.toStationName
          ? `${trip.fromStationName} → ${trip.toStationName}`
          : undefined,
      tripDepartureTime: trip.departureTime,
      gareId: trip.gareId,
      gareName: trip.gareName,
      companyId: trip.operatorId,
      companyName: trip.operatorName,
      type: dto.type ?? 'other',
      severity: dto.severity ?? 'medium',
      title: dto.description.substring(0, 100),
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: 'open',
      reporterType: 'passenger',
      reportedBy,
    });

    const saved = await this.incidentRepo.save(incident);
    this.logger.log(
      `Incident ${saved.id} created for trip ${dto.trip_id} by ${reportedBy ?? 'anonymous'}`,
    );
    return saved;
  }

  /**
   * List all incidents with optional filters.
   * Frontend: GET /incidents?status=open&page=1
   */
  async findAll(filters: {
    status?: string;
    page?: number;
    limit?: number;
    gareId?: string;
    companyId?: string;
  }): Promise<{
    data: Incident[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.incidentRepo.createQueryBuilder('i');

    if (filters.status) {
      qb.andWhere('i.status = :status', { status: filters.status });
    }
    if (filters.gareId) {
      qb.andWhere('i.gare_id = :gareId', { gareId: filters.gareId });
    }
    if (filters.companyId) {
      qb.andWhere('i.company_id = :companyId', {
        companyId: filters.companyId,
      });
    }

    qb.orderBy('i.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get incident by ID.
   * Frontend: GET /incidents/:id
   */
  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }
    return incident;
  }

  /**
   * Update incident fields.
   * Frontend: PUT /incidents/:id
   */
  async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);
    Object.assign(incident, dto);
    return this.incidentRepo.save(incident);
  }

  // ---- Resolution ----

  /**
   * Assign an incident to a support agent.
   * Frontend (Admin): POST /incidents/:id/assign
   */
  async assign(
    id: string,
    payload: { assignedTo: string; assignedToName?: string },
  ): Promise<Incident> {
    const incident = await this.findOne(id);
    incident.assignedTo = payload.assignedTo;
    incident.assignedToName = payload.assignedToName ?? '';
    incident.status =
      incident.status === 'open' ? 'in_progress' : incident.status;
    return this.incidentRepo.save(incident);
  }

  /**
   * Resolve an incident.
   * Frontend: POST /incidents/:id/resolve
   */
  async resolve(id: string, dto: ResolveIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);
    if (incident.status === 'resolved') {
      throw new BadRequestException(`Incident ${id} is already resolved`);
    }

    incident.status = 'resolved';
    incident.resolvedBy = dto.resolvedBy;
    incident.resolvedByName = dto.resolvedByName;
    incident.resolvedAt = new Date();

    return this.incidentRepo.save(incident);
  }

  // ---- Notification ----

  /**
   * Notify all passengers on the trip about this incident.
   * Frontend (Admin): POST /incidents/:id/notify
   *
   * In production: sends push + SMS via Firebase / Infobip.
   * Current: logs and returns mock count.
   */
  async notifyPassengers(
    id: string,
    dto: NotifyPassengersDto,
  ): Promise<{ notifiedCount: number; channels: string[] }> {
    const incident = await this.findOne(id);
    if (!incident.tripId) {
      throw new BadRequestException('Incident has no linked trip');
    }

    // Count passengers on this trip (tickets with active/boarded status)
    const ticketCount = await this.ticketRepo.count({
      where: [
        { tripId: incident.tripId, status: 'active' },
        { tripId: incident.tripId, status: 'boarded' },
      ],
    });

    this.logger.log(
      `Notifying ${ticketCount} passengers for incident ${id} (type: ${dto.notificationType}) via ${dto.channels.join(', ')}`,
    );

    // In production: iterate tickets, get user contacts, send via Firebase + Infobip
    // For now, return the count

    return {
      notifiedCount: ticketCount,
      channels: dto.channels,
    };
  }

  // ---- Societe validation ----

  /**
   * Validate or reject an incident (Societe manager workflow).
   */
  async validate(
    id: string,
    payload: {
      validationStatus: 'validated' | 'rejected';
      validatedBy: string;
      validationComment?: string;
    },
  ): Promise<Incident> {
    const incident = await this.findOne(id);
    incident.validationStatus = payload.validationStatus;
    incident.validatedBy = payload.validatedBy;
    incident.validatedAt = new Date();
    incident.validationComment = payload.validationComment ?? '';
    return this.incidentRepo.save(incident);
  }
}
