import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";


@Entity("credentials")
export class Credential {
  @PrimaryColumn({ type: "varchar", length: 255 })
  credentialID!: string;

  @Column({ type: "bytea" })
  credentialPublicKey!: Buffer;

  @Column({ type: "bigint" })
  counter!: number;

  @Column({ type: "varchar", length: 32, array: true })
  transports!: string[];

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne("User", "credentials")
  @JoinColumn({ name: "userId" })
  user!: any;

  @CreateDateColumn()
  createdAt!: Date;
}
