import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { ConnectionEntity } from 'src/connections/entities/connection.entity';

@Entity('users')
export class UserEntity {
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

  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];

  @OneToMany(() => FileEntity, (file) => file.user)
  files: FileEntity[];

  @OneToOne(() => FileEntity, { nullable: true, eager: true })
  @JoinColumn()
  profile_file: FileEntity | null;

  @OneToMany(() => ConnectionEntity, (connection) => connection.requester)
  sentConnectionRequests: ConnectionEntity[];

  @OneToMany(() => ConnectionEntity, (connection) => connection.receiver)
  receivedConnectionRequests: ConnectionEntity[];
}
