import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFkColumnNames1787207367237 implements MigrationInterface {
  name = 'UpdateFkColumnNames1787207367237';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_08d1346ff91abba68e5a637cfdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_d19892d8f03928e5bfc7313780c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_74f26841f84547bdd5759d46b90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_81b3ad376672ed22120c0e7924f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_108ff8a2d40c2b294511c92a7c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_1beb66d6bdd694692f8eb9881b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_646afe752c665e1b454a6e0dcc0"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_34701b0b8d466af308ba202e4ef"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_90bc62e96b48a437a78593f78f0"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956"`);
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_4548cc4a409b8651ec75f70e280"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_9adf2d3106c6dc87d6262ccadfe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" DROP CONSTRAINT "FK_5d1a40f48438176ce68d266f8e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" DROP CONSTRAINT "FK_766ce22110750796d29c40e7072"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" DROP CONSTRAINT "FK_17eebe74c320058bf379b0dbfab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" DROP CONSTRAINT "FK_7521f63546adc04aa60e868a655"`,
    );
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "project_members" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "project_members" DROP COLUMN "projectId"`);
    await queryRunner.query(`ALTER TABLE "labels" DROP COLUMN "workspaceId"`);
    await queryRunner.query(`ALTER TABLE "labels" DROP COLUMN "creatorId"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "leadId"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "creatorId"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "workspaceId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "creatorId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "projectId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "parentTaskId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "taskId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "authorId"`);
    await queryRunner.query(`ALTER TABLE "workspace_invite_emails" DROP COLUMN "inviteLinkId"`);
    await queryRunner.query(`ALTER TABLE "workspace_invite_emails" DROP COLUMN "acceptedById"`);
    await queryRunner.query(`ALTER TABLE "invite_links" DROP COLUMN "workspaceId"`);
    await queryRunner.query(`ALTER TABLE "invite_links" DROP COLUMN "creatorId"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "user_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_abde089be1cb8f9ebc85211e8b7" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_b190bf96533a5274bbdf2eaa3f2" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_f92749a9dcdd54f83bdde8edfd5" FOREIGN KEY ("lead_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_8a7ccdb94bcc8635f933c8f8080" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_af78b8fc6857fe0a10d1bb1699e" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_f4cb489461bc751498a28852356" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_54fc42a253a8338488ec1f960ad" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_18c2493067c11f44efb35ca0e03" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" ADD CONSTRAINT "FK_f05e6be8bb6c1ad03e4f3160e02" FOREIGN KEY ("invite_link_id") REFERENCES "invite_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" ADD CONSTRAINT "FK_6c73f1dcab2af4da04daec8fbda" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" ADD CONSTRAINT "FK_6eccd8f45a092d8106f5e30ca6a" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" ADD CONSTRAINT "FK_97b4df4290f72ec3d7b8e55c948" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invite_links" DROP CONSTRAINT "FK_97b4df4290f72ec3d7b8e55c948"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" DROP CONSTRAINT "FK_6eccd8f45a092d8106f5e30ca6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" DROP CONSTRAINT "FK_6c73f1dcab2af4da04daec8fbda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" DROP CONSTRAINT "FK_f05e6be8bb6c1ad03e4f3160e02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_18c2493067c11f44efb35ca0e03"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_54fc42a253a8338488ec1f960ad"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_f4cb489461bc751498a28852356"`);
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_af78b8fc6857fe0a10d1bb1699e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_8a7ccdb94bcc8635f933c8f8080"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_f92749a9dcdd54f83bdde8edfd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_b190bf96533a5274bbdf2eaa3f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_abde089be1cb8f9ebc85211e8b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "user_id" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "invite_links" ADD "creatorId" uuid`);
    await queryRunner.query(`ALTER TABLE "invite_links" ADD "workspaceId" uuid`);
    await queryRunner.query(`ALTER TABLE "workspace_invite_emails" ADD "acceptedById" uuid`);
    await queryRunner.query(`ALTER TABLE "workspace_invite_emails" ADD "inviteLinkId" uuid`);
    await queryRunner.query(`ALTER TABLE "comments" ADD "authorId" uuid`);
    await queryRunner.query(`ALTER TABLE "comments" ADD "taskId" uuid`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "parentTaskId" uuid`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "projectId" uuid`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "creatorId" uuid`);
    await queryRunner.query(`ALTER TABLE "projects" ADD "workspaceId" uuid`);
    await queryRunner.query(`ALTER TABLE "projects" ADD "creatorId" uuid`);
    await queryRunner.query(`ALTER TABLE "projects" ADD "leadId" uuid`);
    await queryRunner.query(`ALTER TABLE "labels" ADD "creatorId" uuid`);
    await queryRunner.query(`ALTER TABLE "labels" ADD "workspaceId" uuid`);
    await queryRunner.query(`ALTER TABLE "project_members" ADD "projectId" uuid`);
    await queryRunner.query(`ALTER TABLE "project_members" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "invite_links" ADD CONSTRAINT "FK_7521f63546adc04aa60e868a655" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invite_links" ADD CONSTRAINT "FK_17eebe74c320058bf379b0dbfab" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" ADD CONSTRAINT "FK_766ce22110750796d29c40e7072" FOREIGN KEY ("inviteLinkId") REFERENCES "invite_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invite_emails" ADD CONSTRAINT "FK_5d1a40f48438176ce68d266f8e9" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_9adf2d3106c6dc87d6262ccadfe" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_4548cc4a409b8651ec75f70e280" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_90bc62e96b48a437a78593f78f0" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_34701b0b8d466af308ba202e4ef" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_646afe752c665e1b454a6e0dcc0" FOREIGN KEY ("leadId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_1beb66d6bdd694692f8eb9881b4" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_108ff8a2d40c2b294511c92a7c8" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_81b3ad376672ed22120c0e7924f" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_74f26841f84547bdd5759d46b90" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_d19892d8f03928e5bfc7313780c" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_08d1346ff91abba68e5a637cfdb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
