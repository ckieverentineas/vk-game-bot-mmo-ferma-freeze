import { User, Builder, Planet } from "@prisma/client"
import { Context } from "vk-io"
import prisma from "../../prisma";
import { Input, Output, Require } from "../datacenter/builder_config";
import { Send_Message } from "../account/service";
import Generator_Nickname from "../../../module/fab/generator_name";
import { Randomizer_Float } from "../service";
import { Rand_Int } from "../../../module/fab/random";

export async function Time_Controller(context: Context, user: User, id_planet: number) {
    for (const builder of await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet } })) {
        const config: Builder_Selector = {
            'Шахты': Mine_Controller,
            'Электростанция': Powerstation_Controller,
            'Солнечная электростанция': Powerstation_Solar_Controller,
            'Центробанк': Central_Bank_Controller,
            'Города': City_Controller,
            'Склад': Storage_Controller,
            'Завод': Factory_Controller,
            'Археологический центр': Archaeological_Center_Controller,
            'Лаборатория': Laboratory_Controller,

        }
        try {
            await config[builder.name](context, user, builder, id_planet)
        } catch (e) {
            console.log(`Нет такой постройки  ${e}`)
        }
        
    } 
}
type Builder_Selector = {
    [key: string]: (context: Context, user: User, builder: Builder, id_planet: number) => Promise<void>;
}

async function Resource_Finder_Nafig(input_storage: Input[], input_mine: Input, target: string, datenow: Date, dateold: Date, global_koef: number) {
    const data = { income: 0, counter: 0 }
    for (let i=0; i < input_storage.length; i++) {
        const store = input_storage[i]
        if (store.name == target) {
            console.log(`${input_mine.name}: ${input_mine.income} * (${Number(datenow)} - ${Number(dateold)})/${input_mine.time}*${global_koef}=${input_mine.income * (Number(datenow)-Number(dateold))/input_mine.time*global_koef}`)
            data.income = input_mine.income * (Number(datenow)-Number(dateold))/input_mine.time*global_koef
            data.counter = i
        }
    }
    return data
}

async function Mine_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { await Send_Message(context.peerId, 'Але, у вас склада нет на базе, вы дома?'); return }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)
    const inputs_mine: Input[] = JSON.parse(builder.input)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    //let event_logger = ``
    const income_wil = { coal: 0, gas: 0, oil: 0, slate: 0, turf: 0, uranium: 0, iron: 0, golden: 0, artefact: 0, crystal: 0 }
    for (const input of inputs_mine) {
        if (input.name == 'golden') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'golden', datenow, dateold, global_koef)
            if ( data.income < planet.golden ) {
                inputs_storage[data.counter].income += data.income
                income_wil.golden += data.income
            }
        }
        if (input.name == 'iron') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'iron', datenow, dateold, global_koef)
            if ( data.income < planet.iron ) {
                inputs_storage[data.counter].income += data.income
                income_wil.iron += data.income
            }
        }
        if (input.name == 'coal') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'coal', datenow, dateold, global_koef)
            if ( data.income < planet.coal ) {
                inputs_storage[data.counter].income += data.income
                income_wil.coal += data.income
            }
        }
        if (input.name == 'crystal') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'crystal', datenow, dateold, global_koef)
            if ( data.income < planet.crystal ) {
                inputs_storage[data.counter].income += data.income
                income_wil.crystal += data.income
            }
        }
        if (input.name == 'artefact') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'artefact', datenow, dateold, global_koef)
            if ( data.income < planet.artefact ) {
                inputs_storage[data.counter].income += data.income
                income_wil.artefact += data.income
            }
        }
    }
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage) } }),
        prisma.planet.update({ where: { id: id_planet }, data: { coal: { decrement: income_wil.coal }, gas: { decrement: income_wil.gas }, oil: { decrement: income_wil.oil }, slate: { decrement: income_wil.slate }, turf: { decrement: income_wil.turf }, uranium: { decrement: income_wil.uranium }, iron: { decrement: income_wil.iron }, golden: { decrement: income_wil.golden }, artefact: { decrement: income_wil.artefact }, crystal: { decrement: income_wil.crystal } } })
    ]).then(([]) => {
        console.log('Успешная добыча ресов нафиг')
    })
    .catch((error) => {
        //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
        console.error(`Ошибка: ${error.message}`);
    });
    
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление шахт нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
}

async function Resource_Finder_Nafig_Outcome(input_storage: Input[], input_mine: Output, target: string, datenow: Date, dateold: Date, global_koef: number) {
    const data = { income: 0, counter: 0 }
    for (let i=0; i < input_storage.length; i++) {
        const store = input_storage[i]
        if (store.name == target) {
            console.log(`${input_mine.name}: ${input_mine.outcome} * (${Number(datenow)} - ${Number(dateold)})/${input_mine.time}*${global_koef}=${input_mine.outcome * (Number(datenow)-Number(dateold))/input_mine.time*global_koef}`)
            data.income = input_mine.outcome * (Number(datenow)-Number(dateold))/input_mine.time*global_koef
            data.counter = i
        }
    }
    return data
}
async function Powerstation_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { await Send_Message(context.peerId, 'Але, у вас склада нет на базе, вы дома?'); return }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)
    const inputs_mine: Input[] = JSON.parse(builder.input)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'coal') {
            const data = await Resource_Finder_Nafig_Outcome(inputs_storage, output, 'coal', datenow, dateold, global_koef)
            if ( data.income < inputs_storage[data.counter].income ) {
                inputs_storage[data.counter].income -= data.income
            }
        }
    }
    for (const input of inputs_mine) {
        if (input.name == 'energy') {
            console.log(`${input.name}: ${input.income} * (${Number(datenow)} - ${Number(dateold)})/${input.time}*${global_koef}=${input.income * (Number(datenow)-Number(dateold))/input.time*global_koef}`)
            const data = input.income * (Number(datenow)-Number(dateold))/input.time*global_koef
            console.log(`Добавлено энергии: ${data}`)
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { increment: data }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
                prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage) } }),
            ]).then(([]) => {
                console.log('Успешная работа электростанции')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
        
    }
}

async function Powerstation_Solar_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_mine: Input[] = JSON.parse(builder.input)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    for (const input of inputs_mine) {
        if (input.name == 'energy') {
            console.log(`${input.name}: ${input.income} * (${Number(datenow)} - ${Number(dateold)})/${input.time}*${global_koef}=${input.income * (Number(datenow)-Number(dateold))/input.time*global_koef}`)
            const data = input.income * (Number(datenow)-Number(dateold))/input.time*global_koef
            console.log(`Добавлено энергии: ${data}`)
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { increment: data }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
            ]).then(([]) => {
                console.log('Успешная работа солнечной электростанции')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
        
    }
}

async function Central_Bank_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { await Send_Message(context.peerId, 'Але, у вас склада нет на базе, вы дома?'); return }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)
    const inputs_mine: Input[] = JSON.parse(builder.input)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'golden') {
            const data = await Resource_Finder_Nafig_Outcome(inputs_storage, output, 'coal', datenow, dateold, global_koef)
            if ( data.income < inputs_storage[data.counter].income ) {
                inputs_storage[data.counter].income -= data.income
            }
        }
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление Центробанка нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    for (const input of inputs_mine) {
        if (input.name == 'gold') {
            console.log(`${input.name}: ${input.income} * (${Number(datenow)} - ${Number(dateold)})/${input.time}*${global_koef}=${input.income * (Number(datenow)-Number(dateold))/input.time*global_koef}`)
            const data = input.income * (Number(datenow)-Number(dateold))/input.time*global_koef
            console.log(`Добавлено шекелей: ${data}`)
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { gold: { increment: data }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
                prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage) } }),
            ]).then(([]) => {
                console.log('Успешная работа Центробанка')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
}

async function Factory_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { await Send_Message(context.peerId, 'Але, у вас склада нет на базе, вы дома?'); return }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)
    

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'iron') {
            const data = await Resource_Finder_Nafig_Outcome(inputs_storage, output, 'iron', datenow, dateold, global_koef)
            if ( data.income < inputs_storage[data.counter].income ) {
                inputs_storage[data.counter].income -= data.income
            }
        }
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление Завода нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    const inputs_mine: Input[] = JSON.parse(builder.input)
    for (const input of inputs_mine) {
        if (input.name == 'iron') {
            console.log(`${input.name}: ${input.income} * (${Number(datenow)} - ${Number(dateold)})/${input.time}*${global_koef}=${input.income * (Number(datenow)-Number(dateold))/input.time*global_koef}`)
            const data = input.income * (Number(datenow)-Number(dateold))/input.time*global_koef
            console.log(`Добавлено шекелей: ${data}`)
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { iron: { increment: data }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
                prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage) } }),
            ]).then(([]) => {
                console.log('Успешная работа Завода')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
}

async function City_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_mine: Input[] = JSON.parse(builder.input)
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление городами нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    for (const input of inputs_mine) {
        if (input.name == 'worker') {
            const worker_planet = input.income
            const worker_check = await prisma.worker.count({ where: { id_planet: id_planet, id_user: user.id } })
            console.log(`${worker_check} < ${worker_planet}`)
            let limiter = worker_planet - worker_check
            if (worker_check < worker_planet) {
                for (const worker of await prisma.worker.findMany({ where: { id_user: user.id } })) {
                    if (worker.id_planet != id_planet ) {
                        const worker_planet_check = await prisma.planet.findFirst({ where: { id: worker.id_planet || 0 } })
                        if (!worker_planet_check && limiter > 0) {
                            await prisma.$transaction([
                                prisma.worker.update({ where: { id: worker.id }, data: { id_planet: id_planet, update: datenow, id_builder: 0 } }),
                                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
                            ]).then(([]) => {
                                console.log(`Города успешно выявили рабочего ${worker.name}-${worker.id} с несуществующих планет и эвакуировали на ${planet.name}-${planet.id}`)
                                limiter--
                            }).catch((error) => {
                                console.error(`Ошибка: ${error.message}`);
                            });
                        }
                    }
                }
                if (limiter > 0) {
                    await prisma.$transaction([
                        prisma.worker.create({ data: { id_user: user.id, name: await Generator_Nickname(), id_planet: id_planet } }),
                        prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
                    ]).then(([worker_new]) => {
                        console.log(`Города успешно наняли недостающего рабочего ${worker_new.name}-${worker_new.id} на ${planet.name}-${planet.id}`)
                    }).catch((error) => {
                        console.error(`Ошибка: ${error.message}`);
                    });
                }
            }
            const builder_list: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet } })
            for (const builder of builder_list) {
                const requires_list: Require[] = JSON.parse(builder.require)
                for (const require of requires_list) {
                    if (require.name == 'worker') {
                        const worker_check_list = await prisma.worker.count({ where: { id_builder: builder.id } })
                        if (worker_check_list < Math.floor(require.limit)) {
                            let limiter_list = Math.floor(require.limit) - worker_check_list
                            for (const worker_sel of await prisma.worker.findMany({ where: { id_planet: id_planet } })) {
                                const worker_clear = await prisma.builder.findFirst({ where: { id: worker_sel.id_builder || 0 } })
                                if (!worker_clear && limiter_list > 0) {
                                    await prisma.$transaction([
                                        prisma.worker.update({ where: { id: worker_sel.id }, data: { update: datenow, id_builder: builder.id } }),
                                        prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
                                    ]).then(([]) => {
                                        console.log(`Города успешно выявили безработного ${worker_sel.name}-${worker_sel.id} и устроили на работу в ${builder.name}-${builder.id} на ${planet.name}-${planet.id}`)
                                        limiter_list--
                                    }).catch((error) => {
                                        console.error(`Ошибка: ${error.message}`);
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

async function Storage_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление Склада нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
}

async function Archaeological_Center_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { await Send_Message(context.peerId, 'Але, у вас склада нет на базе, вы дома?'); return }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'artefact') {
            const data = await Resource_Finder_Nafig_Outcome(inputs_storage, output, 'artefact', datenow, dateold, global_koef)
            if ( data.income < inputs_storage[data.counter].income ) {
                inputs_storage[data.counter].income -= data.income
                const iron_art = await Randomizer_Float(0, 100)*data.income
                const gold_art = await Randomizer_Float(0, 1000)*data.income
                const energy_art = await Randomizer_Float(0, 10000)*data.income
                const build = await Randomizer_Float(0, 1000) < 10 ? 1*Math.floor(data.income) : 0
                const selector = await Rand_Int(2)
                const speed_new = selector == 0 ? 0.001 : 0
                const income_new = selector == 1 ? 1.01 : 1
                await prisma.$transaction([
                    prisma.worker.updateMany({ where: { id_user: user.id }, data: { income: { multiply: income_new }, speed: { increment: speed_new } } }),
                    prisma.user.update({ where: { id: user.id }, data: { energy: { increment: energy_art },  gold: { increment: gold_art }, iron: { increment: iron_art }, update: datenow } }),
                    prisma.planet.update({ where: { id: id_planet }, data: { update: datenow, build: { increment: build } } }),
                ]).then(() => {
                    //event_logger += `\n\n⌛ Работники получили повышение ${speed_new > 0 ? 'скорости на 0.001' : 'прибыли на 0.1' }:\n🏦 За прошедшее время прошло ${(koef_week/timer_week).toFixed(2)} дней.` 
                    console.log(`C артефактов выпало: железа ${iron_art}, шекелей ${gold_art}, энергии ${energy_art} площадок ${build} ⌛ Работники ${user.idvk} получили повышение ${speed_new > 0 ? 'скорости на 0.001' : 'прибыли на 0.01%' }\n`);
                })
                .catch((error) => {
                    //event_logger += `⌛ Произошла ошибка прокачки рабочих, попробуйте позже` 
                    console.error(`Ошибка: ${error.message}`);
                });
            }
        }
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление Археологического центра нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
}

async function Laboratory_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
        }
    }
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'energy') {
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: output.outcome * (Number(datenow)-Number(dateold))/output.time}, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                console.log('Успешное потребление Лабораторией нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    const inputs_mine: Input[] = JSON.parse(builder.input)
    for (const input of inputs_mine) {
        if (input.name == 'research') {
            console.log(`${input.name}: ${input.income} * (${Number(datenow)} - ${Number(dateold)})/${input.time}*${global_koef}=${input.income * (Number(datenow)-Number(dateold))/input.time*global_koef}`)
            const data = input.income * (Number(datenow)-Number(dateold))/input.time*global_koef
            console.log(`Добавлено очков исследования: ${data}`)
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { research: { increment: data }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } }),
            ]).then(([]) => {
                console.log('Успешная работа Лаборатории')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
}