import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ length: 128, nullable: true })
  first_name: string;

  @Column({ length: 128, nullable: true })
  last_name: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ length: 128, nullable: true, unique: true })
  student_code: string;

  @Column({ select: false, nullable: false })
  password: string;
}
