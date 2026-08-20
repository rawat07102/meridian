import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWorkspacesTableRelation1787206854560 implements MigrationInterface {
  name = 'UpdateWorkspacesTableRelation1787206854560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP CONSTRAINT "FK_77607c5b6af821ec294d33aab0c"`,
    );
    await queryRunner.query(`ALTER TABLE "workspace_members" DROP COLUMN "workspaceId"`);
    await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "ownerId"`);
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "UQ_4896b609c71ca5ad20ad662077b"`,
    );
    await queryRunner.query(`ALTER TABLE "workspace_members" DROP COLUMN "workspace_id"`);
    await queryRunner.query(`ALTER TABLE "workspace_members" ADD "workspace_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "workspaces" ADD "owner_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "UQ_4896b609c71ca5ad20ad662077b" UNIQUE ("user_id", "workspace_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD CONSTRAINT "FK_3bc45ecdd8fdc2108bb92516dde" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP CONSTRAINT "FK_3bc45ecdd8fdc2108bb92516dde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "UQ_4896b609c71ca5ad20ad662077b"`,
    );
    await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "workspaces" ADD "owner_id" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "workspace_members" DROP COLUMN "workspace_id"`);
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD "workspace_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "UQ_4896b609c71ca5ad20ad662077b" UNIQUE ("user_id", "workspace_id")`,
    );
    await queryRunner.query(`ALTER TABLE "workspaces" ADD "ownerId" uuid`);
    await queryRunner.query(`ALTER TABLE "workspace_members" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD CONSTRAINT "FK_77607c5b6af821ec294d33aab0c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
