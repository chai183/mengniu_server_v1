import { Module } from "@nestjs/common";
import { BaseRepository } from "../repository/base.repository";
import { Repository,EntityManager } from "typeorm";

@Module({})
export class BaseRepositoryModule {
    static forFeature(entities: any[]) {
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