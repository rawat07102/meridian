import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceInviteLinkTables1787049729081 implements MigrationInterface {
  name = 'CreateWorkspaceInviteLinkTables1787049729081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workspace_invite_emails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invite_link_id" uuid NOT NULL, "email" character varying NOT NULL, "accepted_by_user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "inviteLinkId" uuid, "acceptedById" uuid, CONSTRAINT "UQ_0eb8bce649d82cb3f93c4c9ccd7" UNIQUE ("invite_link_id", "email"), CONSTRAINT "PK_dae3f44a0fce71c268626b50564" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "invite_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "workspace_id" uuid NOT NULL, "created_by" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "workspaceId" uuid, "creatorId" uuid, CONSTRAINT "UQ_f1c74b159627ace408af32c879e" UNIQUE ("token"), CONSTRAINT "UQ_6eccd8f45a092d8106f5e30ca6a" UNIQUE ("workspace_id"), CONSTRAINT "PK_df46bd981abebf8f78c5e334705" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" ADD CONSTRAINT "FK_766ce22110750796d29c40e7072" FOREIGN KEY ("inviteLinkId") REFERENCES "invite_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" ADD CONSTRAINT "FK_5d1a40f48438176ce68d266f8e9" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" ADD CONSTRAINT "FK_7521f63546adc04aa60e868a655" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" ADD CONSTRAINT "FK_17eebe74c320058bf379b0dbfab" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invite_links" DROP CONSTRAINT "FK_17eebe74c320058bf379b0dbfab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" DROP CONSTRAINT "FK_7521f63546adc04aa60e868a655"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" DROP CONSTRAINT "FK_5d1a40f48438176ce68d266f8e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" DROP CONSTRAINT "FK_766ce22110750796d29c40e7072"`,
    );
    await queryRunner.query(`DROP TABLE "invite_links"`);
    await queryRunner.query(`DROP TABLE "workspace_invite_emails"`);
  }
}
