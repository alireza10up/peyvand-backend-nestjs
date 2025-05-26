import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { ConnectionEntity } from 'src/connections/entities/connection.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ length: 128, nullable: true })
  firstName: string;

  @Column({ length: 128, nullable: true })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ length: 128, nullable: true, unique: true })
  studentCode: string;

  @Column({ select: false, nullable: false })
  password: string;

  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];

  @OneToMany(() => FileEntity, (file) => file.user)
  files: FileEntity[];

  @OneToOne(() => FileEntity, { nullable: true, eager: true })
  @JoinColumn()
  profileFile: FileEntity | null;

  @OneToMany(() => ConnectionEntity, (connection) => connection.requester)
  sentConnectionRequests: ConnectionEntity[];

  @OneToMany(() => ConnectionEntity, (connection) => connection.receiver)
  receivedConnectionRequests: ConnectionEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.user)
  comments: CommentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
