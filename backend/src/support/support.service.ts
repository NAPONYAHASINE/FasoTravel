import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, User } from '../database/entities';
import {
  SupportTicketQueryDto,
  AssignTicketDto,
  ResolveTicketDto,
  UpdatePriorityDto,
  UpdateStatusDto,
  AddReplyDto,
  CreateSupportMessageDto,
} from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ========== ADMIN ==========

  async findAll(query: SupportTicketQueryDto) {
    const qb = this.ticketRepo.createQueryBuilder('t');

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('t.priority = :priority', { priority: query.priority });
    }
    if (query.search) {
      qb.andWhere(
        '(t.subject ILIKE :search OR t.message ILIKE :search OR t.user_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('t.created_at', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string) {
    const ticket = await this.ticketRepo.findOneBy({ id });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async assign(id: string, dto: AssignTicketDto) {
    const ticket = await this.findOne(id);
    ticket.assignedTo = dto.adminId;
    ticket.status = 'in-progress';
    return this.ticketRepo.save(ticket);
  }

  async resolve(id: string, dto: ResolveTicketDto) {
    const ticket = await this.findOne(id);
    ticket.status = 'resolved';
    ticket.resolution = dto.resolution;
    ticket.resolvedAt = new Date();
    return this.ticketRepo.save(ticket);
  }

  async updatePriority(id: string, dto: UpdatePriorityDto) {
    const ticket = await this.findOne(id);
    ticket.priority = dto.priority;
    return this.ticketRepo.save(ticket);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const ticket = await this.findOne(id);
    ticket.status = dto.status;
    if (dto.status === 'resolved') {
      ticket.resolvedAt = new Date();
    }
    return this.ticketRepo.save(ticket);
  }

  async addReply(id: string, dto: AddReplyDto) {
    const ticket = await this.findOne(id);
    const reply = {
      id: randomUUID(),
      authorId: dto.authorId,
      authorName: dto.authorName,
      authorRole: dto.authorRole,
      message: dto.message,
      createdAt: new Date().toISOString(),
    };
    ticket.replies = [...(ticket.replies ?? []), reply];
    return this.ticketRepo.save(ticket);
  }

  // ========== MOBILE ==========

  async createFromMobile(userId: string, dto: CreateSupportMessageDto) {
    const user = await this.userRepo.findOneBy({ id: userId });
    const ticket = this.ticketRepo.create({
      userId,
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
      userType: 'passenger',
      subject: dto.subject,
      message: dto.message,
      category: dto.category?.toLowerCase() ?? 'other',
      priority: 'medium',
      status: 'open',
      attachments: dto.attachments,
    });
    return this.ticketRepo.save(ticket);
  }

  async getMyTickets(userId: string) {
    return this.ticketRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createIncidentFromMobile(userId: string, dto: CreateSupportMessageDto) {
    const user = await this.userRepo.findOneBy({ id: userId });
    const ticket = this.ticketRepo.create({
      userId,
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
      userType: 'passenger',
      subject: dto.subject,
      message: dto.message,
      category: 'incident',
      priority: 'high',
      status: 'open',
      attachments: dto.attachments,
    });
    return this.ticketRepo.save(ticket);
  }

  async getMyIncidents(userId: string) {
    return this.ticketRepo.find({
      where: { userId, category: 'incident' },
      order: { createdAt: 'DESC' },
    });
  }

  async closeTicket(id: string) {
    const ticket = await this.findOne(id);
    ticket.status = 'closed';
    ticket.resolvedAt = new Date();
    return this.ticketRepo.save(ticket);
  }

  assistantChat(message: string) {
    const responses: Record<string, string> = {
      default:
        "Je suis l'assistant FasoTravel. Comment puis-je vous aider ? Vous pouvez me poser des questions sur vos réservations, trajets, ou signaler un problème.",
    };
    const lower = message.toLowerCase();
    let reply = responses.default;
    if (lower.includes('reservation') || lower.includes('billet')) {
      reply =
        'Pour vérifier votre réservation, rendez-vous dans l\'onglet "Mes billets". Si vous avez un problème, vous pouvez créer un ticket de support.';
    } else if (lower.includes('annul')) {
      reply =
        'Pour annuler un billet, allez dans "Mes billets", sélectionnez le billet, puis appuyez sur "Annuler". Les conditions d\'annulation varient selon la compagnie.';
    } else if (lower.includes('retard') || lower.includes('incident')) {
      reply =
        'Nous sommes désolés pour le désagrément. Vous pouvez signaler un incident via le bouton "Signaler un incident" dans les détails de votre trajet.';
    }
    return { reply, timestamp: new Date().toISOString() };
  }
}
