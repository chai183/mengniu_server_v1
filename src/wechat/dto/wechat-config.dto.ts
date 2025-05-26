import { IsString, IsNotEmpty } from 'class-validator';

export class WechatConfigDto {
  @IsString()
  @IsNotEmpty()
  suiteId: string;

  @IsString()
  @IsNotEmpty()
  suiteSecret: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  encodingAESKey: string;
}

export interface CallbackData {
  xml: {
    ToUserName?: string;
    FromUserName?: string;
    CreateTime?: string;
    MsgType?: string;
    Content?: string;
    MsgId?: string;
    AgentID?: string;
    Event?: string;
    EventKey?: string;
    InfoType?: string;
    SuiteId?: string;
    SuiteTicket?: string;
    TimeStamp?: string;
    AuthCorpId?: string;
  };
} 