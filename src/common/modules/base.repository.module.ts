import { Module } from "@nestjs/common";
import { BaseRepository } from "../repository/base.repository";
import { Repository, EntityManager, ObjectLiteral } from "typeorm";

@Module({})
export class BaseRepositoryModule {
    static forFeature(entities: (new () => ObjectLiteral & { isDeleted: boolean })[]) {
        return {
            module: BaseRepositoryModule,
            providers: entities.map(entity => ({
                provide: entity.name,
                useFactory: (entityManager: EntityManager) => {
                    return new BaseRepository(new Repository(entity, entityManager));
                },
                inject: [EntityManager]
            })),
            exports: entities.map(entity => entity.name),
        }
    }
}