import { FileEntity } from '../../files/entities/file.entity';

export class UserSummaryDto {
  id: number;
  firstName?: string;
  lastName?: string;
  profileFile?: Partial<FileEntity> | null; // Or just the file ID/URL
}
