import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTable1787034068210 implements MigrationInterface {
  name = 'CreateTasksTable1787034068210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "status" character varying NOT NULL, "priority" character varying NOT NULL, "position" double precision NOT NULL, "due_date" date, "start_date" date, "creator_id" uuid NOT NULL, "project_id" uuid NOT NULL, "parent_task_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "creatorId" uuid, "projectId" uuid, "parentTaskId" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_assignees" ("tasksId" uuid NOT NULL, "usersId" uuid NOT NULL, CONSTRAINT "PK_71259eff171eb323f416cd3b74d" PRIMARY KEY ("tasksId", "usersId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_836169568c5c001ee34e7aa78f" ON "task_assignees"  ("tasksId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e54b42e47461564bc4b18b8f93" ON "task_assignees"  ("usersId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_90bc62e96b48a437a78593f78f0" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_34701b0b8d466af308ba202e4ef" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_836169568c5c001ee34e7aa78f7" FOREIGN KEY ("tasksId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_e54b42e47461564bc4b18b8f933" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_e54b42e47461564bc4b18b8f933"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_836169568c5c001ee34e7aa78f7"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_34701b0b8d466af308ba202e4ef"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_90bc62e96b48a437a78593f78f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e54b42e47461564bc4b18b8f93"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_836169568c5c001ee34e7aa78f"`);
    await queryRunner.query(`DROP TABLE "task_assignees"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
