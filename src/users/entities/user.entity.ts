import { Column, Entity, PrimaryGeneratedColumn, Timestamp } from 'typeorm';

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

  @Column({ type: 'timestamp' })
  age: Timestamp;

  @Column({ select: false, nullable: false })
  password: string;
}
