import { FileEntity } from '../../files/entities/file.entity';

export class UserSummaryDto {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileFile?: Partial<FileEntity> | null;
}
