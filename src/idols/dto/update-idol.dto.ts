import { PartialType } from '@nestjs/swagger';
import { CreateIdolDto } from './create-idol.dto';

export class UpdateIdolDto extends PartialType(CreateIdolDto) {}
