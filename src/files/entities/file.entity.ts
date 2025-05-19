import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  mimetype: string;

  @Column({ length: 255 })
  url: string;

  @Column({ default: 'public' })
  visibility: 'public' | 'private';

  @ManyToOne(() => User, user => user.files, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Post, post => post.file)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
