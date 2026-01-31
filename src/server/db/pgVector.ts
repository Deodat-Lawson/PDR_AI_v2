import { customType } from 'drizzle-orm/pg-core';

interface PgVectorConfig {
    dimension: number;
}
export function pgVector(config: PgVectorConfig) {
    return customType<{
        data: number[];
        driverData: number[];
    }>({
        dataType() {
            return `vector(${config.dimension})`;
        },

        fromDriver(value: number[]) {
            return value;
        },

        toDriver(value: number[]) {
            return value;
        },
    });
}