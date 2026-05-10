import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export function OptionalDateField(): PropertyDecorator {
  return function optionalDateField(target, propertyKey) {
    IsOptional()(target, propertyKey);
    Transform(({ value }) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      return new Date(value as string);
    })(target, propertyKey);
    IsDate()(target, propertyKey);
  };
}
