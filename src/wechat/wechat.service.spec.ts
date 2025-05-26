import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WechatService } from './wechat.service';

describe('WechatService', () => {
  let service: WechatService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WechatService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'wechat.token': 'test_token',
                'wechat.encodingAesKey': 'test_encoding_aes_key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WechatService>(WechatService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load configuration correctly', () => {
    expect(configService.get('wechat.token')).toBe('test_token');
    expect(configService.get('wechat.encodingAesKey')).toBe('test_encoding_aes_key');
  });

  describe('validateCallback', () => {
    it('should handle validation errors gracefully', () => {
      const result = service.validateCallback('invalid_signature', '123456', 'nonce', 'echostr');
      expect(result).toBeNull();
    });
  });

  describe('handlePostCallback', () => {
    it('should handle invalid XML gracefully', async () => {
      const invalidXml = 'invalid xml content';
      
      await expect(
        service.handlePostCallback('signature', '123456', 'nonce', invalidXml)
      ).rejects.toThrow();
    });
  });
}); 