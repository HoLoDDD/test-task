import {
    IsNotEmpty,
    IsString,
    IsEnum,
    IsNumber,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import 'reflect-metadata';

/**
 * -------------------------------- TASK 1 --------------------------------
 */
type User = {
    id: string;
    name: string;
    posts: Post[];
};

type Post = {
    id: string;
    text: string;
    user: User;
};

type Select<T> = {
    [Property in keyof T]?: T[Property] extends object
        ? Select<T[Property]>
        : boolean;
};

const userSelect: Select<User> = {
    id: true,
    name: true,
    posts: [
        {
            id: true,
            text: true,
            user: {
                id: true,
            },
        },
    ],
};

/**
 * -------------------------------- TASK 2 --------------------------------
 */

async function task2() {
    const task = async <T>(value: T) => {
        await new Promise((r) => setTimeout(r, 100 * Math.random()));
        console.log(value);
    };

    console.log('[RANDOM]');
    await Promise.all([task(1), task(2), task(3), task(4)]);
    // 4 1 3 2 (random)

    console.log('[QUEUE]');

    const queue = new AsyncQueue();
    await Promise.all([
        queue.add(() => task(1)),
        queue.add(() => task(2)),
        queue.add(() => task(3)),
        queue.add(() => task(4)),
    ]);
    // 1 2 3 4
}

class AsyncQueue {
    queue = [];
    isPendingPromise = false;

    add(promise: () => Promise<void>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                promise,
                resolve,
                reject,
            });
            resolve();
            this.remove();
        });
    }

    remove() {
        if (this.isPendingPromise) {
            return false;
        }

        const item = this.queue.shift();
        if (!item) {
            return false;
        }

        try {
            this.isPendingPromise = true;
            item.promise()
                .then((value) => {
                    this.isPendingPromise = false;
                    item.resolve(value);
                    this.remove();
                })
                .catch((err) => {
                    this.isPendingPromise = false;
                    item.reject(err);
                    this.remove();
                });
        } catch (err) {
            this.isPendingPromise = false;
            item.reject(err);
            this.remove();
        }

        return true;
    }
}

// task2();

/**
 * -------------------------------- TASK 3 --------------------------------
 */

class IncrementalMap {
    selectedMap = new Map();
    snapshots = new Map();
    selectedSnapshot = 0;

    constructor() {
        this.snapshots.set(0, this.selectedMap);
    }

    set(key: string, value: any) {
        this.selectedMap.set(key, value);
    }

    get(key: string) {
        return this.selectedMap.get(key);
    }

    snapshot(version: number) {
        this.snapshots.set(version, new Map(this.selectedMap));
    }

    loadSnapshot(version: number) {
        this.selectedMap = this.snapshots.get(version);
    }
    logSnapshots() {
        console.log(this.snapshots);
    }
}

function task3() {
    const map = new IncrementalMap();

    console.log('[SNAPSHOT 0]');

    map.set('a', 10);
    map.set('b', 10);
    console.log('a: ' + map.get('a'));
    console.log('b: ' + map.get('b'));

    map.snapshot(1);
    console.log('[SNAPSHOT 1 SAVED]');
    console.log('[CHANGES AFTER SAVE]');

    map.set('a', 20);
    console.log('a: ' + map.get('a'));
    console.log('b: ' + map.get('b'));

    console.log('[SNAPSHOT 1 LOADED]');
    map.loadSnapshot(1);
    console.log('a: ' + map.get('a'));
    console.log('b: ' + map.get('b'));

    map.logSnapshots();
}

// task3();

/**
 * -------------------------------- TASK 4 --------------------------------
 */

export const RABBITMQ = {
    RABBITMQ_HOST: {
        value: 'localhost',
        mod: 'WRITE',
    },
    RABBITMQ_PORT: {
        value: 1234,
        mod: 'READ',
    },
    RABBITMQ_USER: {
        value: 'username',
        mod: 'WRITE',
    },
    RABBITMQ_PASSWORD: {
        value: 'password',
        mod: 'LOCK',
    },
};

class Config {
    private readonly config: ConfigurationDto;

    constructor(config: any) {
        this.config = config;
    }

    public get<K extends keyof ConfigurationDto>(
        key: K
    ): ConfigurationDto[K] | undefined {
        if (!this.config[key]) {
            return;
        }
        return this.config[key];
    }
}

const config = new Config(RABBITMQ);

// console.log(config.get('RABBITMQ_HOST'));
// console.log(config.get('RABBITMQ_PORT'));
// console.log(config.get('RABBITMQ_PASSWORD'));
// console.log(config.get('RABBITMQ_USER'));

enum EMod {
    READ = 'READ',
    WRITE = 'WRITE',
    LOCK = 'LOCK',
}

class StringPropertyDto {
    @IsString()
    value: string;

    @IsEnum(EMod)
    mod: string;
}

class NumberPropertyDto {
    @IsNumber()
    value: number;

    @IsEnum(EMod)
    mod: string;
}

class ConfigurationDto {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => StringPropertyDto)
    RABBITMQ_HOST: StringPropertyDto;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => NumberPropertyDto)
    RABBITMQ_PORT: NumberPropertyDto;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => StringPropertyDto)
    RABBITMQ_USER: StringPropertyDto;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => StringPropertyDto)
    RABBITMQ_PASSWORD: StringPropertyDto;
}

/**
 * -------------------------------- TASK 5 --------------------------------
 */

function mock<T>() {
    const mockedMethods: Record<string, Function> = {};

    const mockedObject: T = {} as T;

    for (const prop in mockedObject) {
        if (typeof mockedObject[prop] === 'function') {
            mockedMethods[prop] = function () {};
        }
    }

    return mockedMethods as unknown as T;
}

interface IUser {
    getName(): string;
    setAge(age: number): void;
    save(name: string, age: number): Promise<IUser>;
}

const mockUser = mock<IUser>();

// mockUser.setAge(10);

// mockUser.setAge.mock.calls = [
//     {
//         args: [10]
//     }
// ]
