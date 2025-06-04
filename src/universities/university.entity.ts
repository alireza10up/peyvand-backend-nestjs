import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class University {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
