import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { User } from '../entities';

interface RequestContext {
  user?: {
    id: number;
  };
}

@Injectable({ scope: Scope.DEFAULT })
export class RequestContextService {
  private static asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * 设置当前请求上下文中的用户
   * @param user 当前用户
   */
  static setCurrentUser(user: { id: number }): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store.user = user;
    }
  }

  /**
   * 获取当前请求上下文中的用户
   * @returns 当前用户或undefined
   */
  static getCurrentUser(): { id: number } | undefined {
    const store = this.asyncLocalStorage.getStore();
    return store?.user;
  }

  /**
   * 为请求执行上下文创建存储
   * @param context 请求上下文对象
   * @param next 下一步执行函数
   */
  static run(context: RequestContext, next: () => any): any {
    return this.asyncLocalStorage.run(context, next);
  }

  /**
   * 清除当前请求上下文
   */
  static clear(): void {
    this.asyncLocalStorage.disable();
    this.asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
  }
} 