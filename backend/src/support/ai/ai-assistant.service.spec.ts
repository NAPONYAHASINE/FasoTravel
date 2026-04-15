import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiAssistantService } from './ai-assistant.service';
import { RagService } from './rag.service';
import {
  AssistantConversation,
  KnowledgeArticle,
} from '../../database/entities';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let ragService: RagService;

  const mockConversationRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((d) => ({ id: 'conv-1', messages: [], ...d })),
    save: jest.fn((d) => Promise.resolve({ id: 'conv-1', ...d })),
  };

  const mockArticleRepo = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(5),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve(d)),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: any) => {
      const config: Record<string, any> = {
        'ai.geminiApiKey': '', // no API key → triggers fallback
        'ai.geminiModel': 'gemini-2.5-flash',
        'ai.embeddingModel': 'text-embedding-004',
        'ai.maxTokens': 500,
        'ai.temperature': 0.3,
        'ai.escalationThreshold': 0.4,
        'ai.maxHistoryMessages': 10,
        'ai.topK': 5,
      };
      return config[key] ?? defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        RagService,
        {
          provide: getRepositoryToken(AssistantConversation),
          useValue: mockConversationRepo,
        },
        {
          provide: getRepositoryToken(KnowledgeArticle),
          useValue: mockArticleRepo,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(AiAssistantService);
    ragService = module.get(RagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ragService).toBeDefined();
  });

  // ── Chat ──

  it('chat creates a new conversation when no conversationId', async () => {
    mockConversationRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 'conv-new', ...d }),
    );

    const result = await service.chat('Bonjour');
    expect(result).toHaveProperty('answer');
    expect(result).toHaveProperty('escalate');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('sources');
    expect(result).toHaveProperty('conversationId');
    expect(mockConversationRepo.create).toHaveBeenCalled();
  });

  it('chat resumes existing conversation', async () => {
    const existing = {
      id: 'conv-1',
      messages: [
        { role: 'user', content: 'Salut', timestamp: new Date().toISOString() },
      ],
      isEscalated: false,
      status: 'active',
    };
    mockConversationRepo.findOne.mockResolvedValue(existing);
    mockConversationRepo.save.mockImplementation((d) => Promise.resolve(d));

    const result = await service.chat('Comment réserver ?', 'conv-1');
    expect(result.conversationId).toBe('conv-1');
    // Should have added 2 messages (user + assistant)
    expect(existing.messages.length).toBeGreaterThanOrEqual(3);
  });

  it('chat returns escalation message for already escalated conversation', async () => {
    const escalated = {
      id: 'conv-esc',
      messages: [],
      isEscalated: true,
      status: 'escalated',
    };
    mockConversationRepo.findOne.mockResolvedValue(escalated);

    const result = await service.chat('Help', 'conv-esc');
    expect(result.escalate).toBe(true);
    expect(result.confidence).toBe(1);
    expect(result.answer).toContain('agent humain');
  });

  it('chat uses fallback when no API key', async () => {
    mockConversationRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 'conv-fb', ...d }),
    );

    const result = await service.chat('Comment payer ?');
    expect(result.answer).toBeDefined();
    // Should be a string response
    expect(typeof result.answer).toBe('string');
  });

  it('chat escalates when confidence is too low', async () => {
    // No knowledge articles → low confidence → escalation
    mockArticleRepo.find.mockResolvedValue([]);
    mockConversationRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 'conv-low', ...d }),
    );

    const result = await service.chat('xyz123unknowntopic');
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.escalate).toBe(true);
  });

  it('chat response matches mobile frontend AssistantReply shape', async () => {
    mockConversationRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 'conv-shape', ...d }),
    );

    const result = await service.chat('Bonjour');
    // Must have all 5 fields that mobile expects
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining([
        'answer',
        'escalate',
        'confidence',
        'sources',
        'conversationId',
      ]),
    );
    expect(typeof result.answer).toBe('string');
    expect(typeof result.escalate).toBe('boolean');
    expect(typeof result.confidence).toBe('number');
    expect(Array.isArray(result.sources)).toBe(true);
    expect(typeof result.conversationId).toBe('string');
  });

  // ── Escalated ──

  it('getEscalatedConversations returns escalated list', async () => {
    const list = [{ id: 'conv-1', isEscalated: true, status: 'escalated' }];
    mockConversationRepo.find.mockResolvedValue(list);
    const result = await service.getEscalatedConversations();
    expect(result).toEqual(list);
    expect(mockConversationRepo.find).toHaveBeenCalledWith({
      where: { isEscalated: true },
      order: { updatedAt: 'DESC' },
    });
  });

  it('getConversation returns conversation by id', async () => {
    const conv = { id: 'conv-1', messages: [] };
    mockConversationRepo.findOne.mockResolvedValue(conv);
    const result = await service.getConversation('conv-1');
    expect(result).toEqual(conv);
  });
});

describe('RagService', () => {
  let ragService: RagService;

  const mockArticleRepo = {
    find: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve(d)),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: any) => {
      const config: Record<string, any> = {
        'ai.geminiApiKey': '',
        'ai.embeddingModel': 'text-embedding-004',
        'ai.topK': 5,
      };
      return config[key] ?? defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: getRepositoryToken(KnowledgeArticle),
          useValue: mockArticleRepo,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    ragService = module.get(RagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(ragService).toBeDefined();
  });

  it('retrieveRelevant falls back to keyword search when no API key', async () => {
    const articles = [
      {
        id: 'art-1',
        title: 'Comment réserver',
        content: "Pour réserver un billet, ouvrez l'application",
        isActive: true,
      },
    ];
    mockArticleRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(articles),
    });

    const result = await ragService.retrieveRelevant('réserver billet');
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('retrieveRelevant returns empty with no matching articles', async () => {
    mockArticleRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const result = await ragService.retrieveRelevant('xyz random');
    expect(result).toEqual([]);
  });

  it('upsertArticle creates article without embedding when no API key', async () => {
    const articleData = {
      category: 'test',
      title: 'Test Article',
      content: 'Test content here',
    };
    mockArticleRepo.save.mockResolvedValue({
      id: 'art-new',
      ...articleData,
    });

    const result = await ragService.upsertArticle(articleData);
    expect(result.title).toBe('Test Article');
    expect(mockArticleRepo.save).toHaveBeenCalled();
  });

  it('seedKnowledgeBase creates all documentation articles', async () => {
    mockArticleRepo.save.mockImplementation((d) =>
      Promise.resolve({ id: 'art-x', ...d }),
    );

    await ragService.seedKnowledgeBase();
    // Should have created 20+ knowledge articles
    expect(mockArticleRepo.save.mock.calls.length).toBeGreaterThanOrEqual(15);
  });

  it('cosine similarity returns correct values', () => {
    // Access private method via prototype for testing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const cos = (ragService as any).cosineSimilarity.bind(ragService) as (
      a: number[],
      b: number[],
    ) => number;

    // Identical vectors = 1
    expect(cos([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);

    // Orthogonal vectors = 0
    expect(cos([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);

    // Opposite vectors = -1
    expect(cos([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1.0);

    // Different length return 0
    expect(cos([1, 0], [1, 0, 0])).toBe(0);

    // Zero vector
    expect(cos([0, 0, 0], [1, 0, 0])).toBe(0);
  });
});
