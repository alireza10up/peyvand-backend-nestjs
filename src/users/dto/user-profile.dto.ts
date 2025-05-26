export class UserProfileDto {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  studentCode?: string;
  profileFile?: number;
}
