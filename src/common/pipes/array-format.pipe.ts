import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ArrayFormatPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return value;
    
    // 处理对象中的所有属性
    if (typeof value === 'object') {
      Object.keys(value).forEach(key => {
        // 检查键名是否以[]结尾
        if (key.endsWith('[]')) {
          const newKey = key.slice(0, -2);
          value[newKey] = value[key];
          delete value[key];
        }
      });
    }
    
    return value;
  }
} 