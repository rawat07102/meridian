import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLabelsAndJoinTables1787043310864 implements MigrationInterface {
  name = 'CreateLabelsAndJoinTables1787043310864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "color" character varying(7) NOT NULL, "workspace_id" uuid NOT NULL, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "workspaceId" uuid, "creatorId" uuid, CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_labels" ("projectsId" uuid NOT NULL, "labelsId" uuid NOT NULL, CONSTRAINT "PK_f38e5c60972c5fc3e8d1e903a5d" PRIMARY KEY ("projectsId", "labelsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e1c451f343faab774a10139b8" ON "project_labels"  ("projectsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27868fed6ee0a78726a0ea94fb" ON "project_labels"  ("labelsId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "task_labels" ("tasksId" uuid NOT NULL, "labelsId" uuid NOT NULL, CONSTRAINT "PK_12b077fa98a4ace22fb1460a085" PRIMARY KEY ("tasksId", "labelsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3bc7e06b961bf72550f33c27cc" ON "task_labels"  ("tasksId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64f274b789e6b3464466d2d835" ON "task_labels"  ("labelsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_81b3ad376672ed22120c0e7924f" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_74f26841f84547bdd5759d46b90" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_labels" ADD CONSTRAINT "FK_3e1c451f343faab774a10139b89" FOREIGN KEY ("projectsId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_labels" ADD CONSTRAINT "FK_27868fed6ee0a78726a0ea94fbc" FOREIGN KEY ("labelsId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_3bc7e06b961bf72550f33c27cce" FOREIGN KEY ("tasksId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_64f274b789e6b3464466d2d8350" FOREIGN KEY ("labelsId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_64f274b789e6b3464466d2d8350"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_3bc7e06b961bf72550f33c27cce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_labels" DROP CONSTRAINT "FK_27868fed6ee0a78726a0ea94fbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_labels" DROP CONSTRAINT "FK_3e1c451f343faab774a10139b89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_74f26841f84547bdd5759d46b90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_81b3ad376672ed22120c0e7924f"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_64f274b789e6b3464466d2d835"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3bc7e06b961bf72550f33c27cc"`);
    await queryRunner.query(`DROP TABLE "task_labels"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_27868fed6ee0a78726a0ea94fb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3e1c451f343faab774a10139b8"`);
    await queryRunner.query(`DROP TABLE "project_labels"`);
    await queryRunner.query(`DROP TABLE "labels"`);
  }
}
