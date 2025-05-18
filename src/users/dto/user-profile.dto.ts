export class UserProfileDto {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  birth_date?: Date;
  student_code?: string;
}
