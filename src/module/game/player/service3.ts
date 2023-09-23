import { User, Builder, Planet, Corporation, Corporation_Builder } from "@prisma/client"
import { Context } from "vk-io"
import prisma from "../../prisma";
import { Input, Output, Require, Storages, builder_config } from "../datacenter/builder_config";
import Generator_Nickname from "../../../module/fab/generator_name";
import { Randomizer_Float } from "../service";
import { Rand_Int } from "../../../module/fab/random";
import { icotransl_list } from "../datacenter/resources_translator";
import { Send_Message } from "../../../module/fab/helper";
import { chat_id } from "../../../index";
import { Update_Statistics } from "./statistics";

export async function Time_Controller(context: Context, user: User, id_planet: number): Promise<string | undefined> {
    let calc = ''
    const city_check = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: "Города" } })
    console.log(`Запускаем сбор для ${context.peerId} на Планете ${id_planet}`)
    if (!city_check) {
        calc += `🔔🔕 На планете-${id_planet} нет Городов для управления рабочими и их наймом\n`;
    }
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { calc += `🔔🔕 Для работы планеты-${id_planet} нужно построить склад\n`; }
    for (const builder of await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet } })) {
        calc += await Builder_Lifer(user, builder, id_planet);
    } 
    return calc
}
type Builder_Selector = {
    [key: string]: (user: User, builder: Builder, id_planet: number) => Promise<string>;
}
export async function Builder_Lifer(user: User, builder: Builder, id_planet: number): Promise<string> {
    let calc = ''
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
        calc += await config[builder.name](user, builder, id_planet)
        console.log(`Запуск обработки ${builder.name} для пользователя ${user.id} на планете ${id_planet}`)
    } catch (e) {
        console.log(`Нет такой постройки  ${e}`)
    }
    return calc
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

async function Mine_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return event_logger }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const storage_base: Storages = JSON.parse(storage.storage!)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    // просчитываем доход за прошедшее время
    const coal_income_will = ((builse.input!.coal.income*((builder.lvl)**builse.input!.coal.koef))*(Number(datenow)-Number(dateold))/builse.input!.coal.time) * global_koef
    const golden_income_will = ((builse.input!.golden.income*((builder.lvl)**builse.input!.golden.koef))*(Number(datenow)-Number(dateold))/builse.input!.golden.time) * global_koef
    const iron_income_will = ((builse.input!.iron.income*((builder.lvl)**builse.input!.iron.koef))*(Number(datenow)-Number(dateold))/builse.input!.iron.time) * global_koef
    const gas_income_will = ((builse.input!.gas.income*((builder.lvl)**builse.input!.gas.koef))*(Number(datenow)-Number(dateold))/builse.input!.gas.time) * global_koef
    const oil_income_will = ((builse.input!.oil.income*((builder.lvl)**builse.input!.oil.koef))*(Number(datenow)-Number(dateold))/builse.input!.oil.time) * global_koef
    const artefact_income_will = ((builse.input!.artefact.income*((builder.lvl)**builse.input!.artefact.koef))*(Number(datenow)-Number(dateold))/builse.input!.artefact.time) * global_koef
    const crystal_dirt_income_will = ((builse.input!.crystal_dirt.income*((builder.lvl)**builse.input!.crystal_dirt.koef))*(Number(datenow)-Number(dateold))/builse.input!.crystal_dirt.time) * global_koef
    const uranium_income_will = ((builse.input!.uranium.income*((builder.lvl)**builse.input!.uranium.koef))*(Number(datenow)-Number(dateold))/builse.input!.uranium.time) * global_koef
    // проверяем, остались ли ресурсы на планете и есть ли место на складе
    const coal_profit = storage_base.coal.count+coal_income_will  <= (storage_base.coal.limit*((builder.lvl)**storage_base.coal.koef_limit)) && planet.coal  >= coal_income_will ? coal_income_will : 0
    const golden_profit = storage_base.golden.count+golden_income_will  <= (storage_base.golden.limit*((builder.lvl)**storage_base.golden.koef_limit)) && planet.golden  >= golden_income_will ? golden_income_will : 0
    const iron_profit = storage_base.iron.count+iron_income_will  <= (storage_base.iron.limit*((builder.lvl)**storage_base.iron.koef_limit)) && planet.iron  >= iron_income_will ? iron_income_will : 0
    const gas_profit = storage_base.gas.count+gas_income_will  <= (storage_base.gas.limit*((builder.lvl)**storage_base.gas.koef_limit)) && planet.gas  >= gas_income_will ? gas_income_will : 0
    const oil_profit = storage_base.oil.count+oil_income_will  <= (storage_base.oil.limit*((builder.lvl)**storage_base.oil.koef_limit)) && planet.oil  >= oil_income_will ? oil_income_will : 0
    const artefact_profit = storage_base.artefact.count+artefact_income_will  <= (storage_base.artefact.limit*((builder.lvl)**storage_base.artefact.koef_limit)) && planet.artefact  >= artefact_income_will ? artefact_income_will : 0
    const crystal_dirt_profit = storage_base.crystal_dirt.count+crystal_dirt_income_will  <= (storage_base.crystal_dirt.limit*((builder.lvl)**storage_base.crystal_dirt.koef_limit)) && planet.crystal  >= crystal_dirt_income_will ? crystal_dirt_income_will : 0
    const uranium_profit = storage_base.uranium.count+uranium_income_will  <= (storage_base.uranium.limit*((builder.lvl)**storage_base.uranium.koef_limit)) && planet.uranium  >= uranium_income_will ? uranium_income_will : 0
    // добавляем добытые ресурсы на склад планеты
    storage_base.coal.count += coal_profit
    storage_base.golden.count += golden_profit
    storage_base.iron.count += iron_profit
    storage_base.gas.count += gas_profit
    storage_base.oil.count += oil_profit
    storage_base.artefact.count += artefact_profit
    storage_base.crystal_dirt.count += crystal_dirt_profit
    storage_base.uranium.count += uranium_profit
    let succeser = false
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { storage: JSON.stringify(storage_base) } }),
        prisma.planet.update({ where: { id: planet.id }, data: { coal: { decrement: coal_profit }, gas: { decrement: gas_profit }, oil: { decrement: oil_profit }, uranium: { decrement: uranium_profit }, iron: { decrement: iron_profit }, golden: { decrement: golden_profit }, artefact: { decrement: artefact_profit }, crystal: { decrement: crystal_dirt_profit } } }),
    ]).then(([]) => {
        console.log(`Успешная добыча ресов ${builder.name}-${builder.id}`)
        succeser = true
    })
    .catch((error) => {
        console.error(`Ошибка добычи ресов ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'golden', value: golden_profit}, { name: 'coal', value: coal_profit }, { name: 'gas', value: gas_profit }, { name: 'oil', value: oil_profit }, { name: 'uranium', value: uranium_profit } ])
    }
    const energy = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy }, update: datenow } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешное потребление ${builder.name}-${builder.id}`)
    })
    .catch((error) => {
        console.error(`Ошибка потребления ${builder.name}-${builder.id}: ${error.message}`);
    });
    return `${event_logger}`
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
async function Powerstation_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return event_logger }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const storage_base: Storages = JSON.parse(storage.storage!)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    // просчитываем потребление за прошедшее время
    const coal_outcome_will = ((builse.output!.coal.outcome*((builder.lvl)**builse.output!.coal.koef))*(Number(datenow)-Number(dateold))/builse.output!.coal.time) * global_koef
    const coal_outcome = storage_base.coal.count-coal_outcome_will > 0 ? coal_outcome_will : 0
    storage_base.coal.count -= coal_outcome
    // просчитываем прибыль за прошедшее время
    const koef_coal = coal_outcome/coal_outcome_will
    const energy_income = ((builse.input!.energy.income*((builder.lvl)**builse.input!.energy.koef))*(Number(datenow)-Number(dateold))/builse.input!.energy.time) * global_koef * koef_coal
    let succeser = false
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { storage: JSON.stringify(storage_base) } }),
        prisma.user.update({ where: { id: user.id }, data: { energy: { increment: energy_income } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        succeser = true
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'energy', value: energy_income}])
    }
    return `${event_logger}`
}

async function Powerstation_Solar_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    // просчитываем прибыль за прошедшее время
    const energy_income = ((builse.input!.energy.income*((builder.lvl)**builse.input!.energy.koef))*(Number(datenow)-Number(dateold))/builse.input!.energy.time) * global_koef
    let succeser = false
    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { energy: { increment: energy_income } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        succeser = true
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'energy', value: energy_income}])
    }
    return `${event_logger}`
}

async function Central_Bank_Controller(user: User, builder: Builder, id_planet: number): Promise<string> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return event_logger }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const storage_base: Storages = JSON.parse(storage.storage!)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    // просчитываем потребление за прошедшее время
    const golden_outcome_will = ((builse.output!.golden.outcome*((builder.lvl)**builse.output!.golden.koef))*(Number(datenow)-Number(dateold))/builse.output!.golden.time) * global_koef
    const golden_outcome = storage_base.golden.count-golden_outcome_will > 0 ? golden_outcome_will : 0
    storage_base.golden.count -= golden_outcome
    const energy_outcome = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    // просчитываем прибыль за прошедшее время
    const koef_golden = golden_outcome/golden_outcome_will
    const gold_income = ((builse.input!.gold.income*((builder.lvl)**builse.input!.gold.koef))*(Number(datenow)-Number(dateold))/builse.input!.gold.time) * global_koef * koef_golden
    let succeser = false
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { storage: JSON.stringify(storage_base) } }),
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy_outcome }, gold: { increment: gold_income } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        succeser = true
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'gold', value: gold_income}])
    }
    
    const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
    const corp_build: Corporation_Builder[] = await prisma.corporation_Builder.findMany({ where: { id_corporation: user.id_corporation } })
    if (corp_build.length < 1 || !corp) { return event_logger }
    let gold_bonus_user = 0
    let gold_bonus_corp = 0
    for (const buildcorp of corp_build) {
        if (buildcorp.name == "Банк") {
            gold_bonus_user = gold_income * (buildcorp.income/100)
        }
        if (buildcorp.name == "Фабрикатор") {
            gold_bonus_corp = gold_income * (buildcorp.income/100)
        }
    }
    console.log(`${gold_bonus_user} юзеру ${gold_bonus_corp} корпе ${gold_income}`)
    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { gold: { increment: gold_bonus_user } } }),
        prisma.corporation.update({ where: { id: user.id_corporation }, data: { gold: { increment: gold_bonus_corp }}})
    ]).then(([]) => {
        console.log(`Работа коропрации с бафами ${builder.name}-${builder.id} успешно`)
        event_logger += gold_bonus_corp > 0 ? `\n🌐 ${corp.name} получает от ${builder.name}-${builder.id}: +${gold_bonus_corp.toFixed(2)}${icotransl_list['gold'].smile}` : ''
        event_logger += gold_bonus_user > 0 ? `\n🌐 ${corp.name} перечисляет в ${builder.name}-${builder.id}: +${gold_bonus_user.toFixed(2)}${icotransl_list['gold'].smile}` : ''
    })
    .catch((error) => {
        console.error(`Ошибка при работе с корпорацией в ${builder.name}-${builder.id}: ${error.message}`);
    });
    return `${event_logger}`
}

async function Factory_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return event_logger }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const storage_base: Storages = JSON.parse(storage.storage!)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    // просчитываем потребление за прошедшее время
    const iron_outcome_will = ((builse.output!.iron.outcome*((builder.lvl)**builse.output!.iron.koef))*(Number(datenow)-Number(dateold))/builse.output!.iron.time) * global_koef
    const iron_outcome = storage_base.golden.count-iron_outcome_will > 0 ? iron_outcome_will : 0
    storage_base.iron.count -= iron_outcome
    const energy_outcome = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    // просчитываем прибыль за прошедшее время
    const koef_iron = iron_outcome/iron_outcome_will
    const metal_income = ((builse.input!.metal.income*((builder.lvl)**builse.input!.metal.koef))*(Number(datenow)-Number(dateold))/builse.input!.metal.time) * global_koef * koef_iron
    let succeser = false
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { storage: JSON.stringify(storage_base) } }),
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy_outcome }, iron: { increment: metal_income } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        succeser = true
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'iron', value: metal_income}])
    }
    return `${event_logger}`
}

async function City_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { event_logger += `🔔🔕 Для работы ${builder.name}-${builder.id} нужна планета\n`; return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_mine: Input[] = JSON.parse(builder.input)
    const outputs: Output[] = JSON.parse(builder.output)
    event_logger += `\n🔔 ${builder.name}-${builder.id}: `
    for (const output of outputs) {
        if (output.name == 'energy') {
            const calc_will = output.outcome * (Number(datenow)-Number(dateold))/output.time
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: calc_will }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                event_logger += ` -${calc_will.toFixed(2)}${icotransl_list[output.name].smile} `
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
    return `${event_logger}`
}

async function Storage_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { event_logger += `🔔🔕 Для работы ${builder.name}-${builder.id} нужна планета\n`; return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const outputs: Output[] = JSON.parse(builder.output)
    event_logger += `\n🔔 ${builder.name}-${builder.id}: `
    for (const output of outputs) {
        if (output.name == 'energy') {
            const calc_will = output.outcome * (Number(datenow)-Number(dateold))/output.time
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: calc_will }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                event_logger += ` -${calc_will.toFixed(2)}${icotransl_list[output.name].smile} `
                console.log('Успешное потребление Склада нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    return `${event_logger}`
}

async function Archaeological_Center_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { event_logger += `🔔🔕 Для работы ${builder.name}-${builder.id} нужен Склад\n`; return event_logger }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { event_logger += `🔔🔕 Для работы ${builder.name}-${builder.id} нужна планета\n`; return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
            if (worker_check != Math.floor(require.limit)) {
                event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
            }
        }
    }
    event_logger += `\n🔔 ${builder.name}-${builder.id}: `
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'artefact') {
            const data = await Resource_Finder_Nafig_Outcome(inputs_storage, output, 'artefact', datenow, dateold, global_koef)
            const art_need = Math.floor(output.outcome)
            console.log(`${art_need} < ${inputs_storage[data.counter].income} && ${inputs_storage[data.counter].income} >= 1`)
            if ( art_need < inputs_storage[data.counter].income && inputs_storage[data.counter].income >= 1 ) {
                inputs_storage[data.counter].income -= art_need
                const iron_art = await Randomizer_Float(0, 100)*art_need
                const gold_art = await Randomizer_Float(0, 1000)*art_need
                const energy_art = await Randomizer_Float(0, 10000)*art_need
                const build = await Randomizer_Float(0, 1000) > 900 ? 1*art_need : 0
                const selector = await Rand_Int(2)
                const speed_new = selector == 0 ? 0.001 : 0
                const income_new = selector == 1 ? 1.01 : 1
                const count_worker = await prisma.worker.count({ where: { id_planet: id_planet } })
                await prisma.$transaction([
                    prisma.worker.updateMany({ where: { id_user: user.id, id_planet: id_planet }, data: { income: { multiply: income_new }, speed: { increment: speed_new } } }),
                    prisma.user.update({ where: { id: user.id }, data: { energy: { increment: energy_art },  gold: { increment: gold_art }, iron: { increment: iron_art }, update: datenow } }),
                    prisma.planet.update({ where: { id: id_planet }, data: { update: datenow, build: { increment: build } } }),
                    prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage), update: datenow } })
                ]).then(() => {
                    if (build > 0) {
                        Send_Message(chat_id, `🌟 Поздравляем [https://vk.com/id${user.idvk}|${user.name}] c прокачкой Планеты-${planet.id} на ${build} площадки`)
                    }
                    event_logger += `${icotransl_list[output.name].smile} +${iron_art.toFixed(2)}${icotransl_list['iron'].smile}, +${gold_art.toFixed(2)}${icotransl_list['gold'].smile}, +${energy_art.toFixed(2)}${icotransl_list['energy'].smile} +${build}⚒ 👥${count_worker} --> ${speed_new > 0 ? '+0.001🧭' : '*0.01%📈' }\n` 
                    console.log(`C артефактов выпало: железа ${iron_art}, шекелей ${gold_art}, энергии ${energy_art} площадок ${build} ⌛ Работники ${user.idvk} получили повышение ${speed_new > 0 ? 'скорости на 0.001' : 'прибыли на 0.01%' }\n`);
                })
                .catch((error) => {
                    //event_logger += `⌛ Произошла ошибка прокачки рабочих, попробуйте позже` 
                    console.error(`Ошибка: ${error.message}`);
                });
                await Update_Statistics(user, [{ name: 'artefact', value: art_need} ])
            }
        }
        if (output.name == 'energy') {
            const calc_will = output.outcome * (Number(datenow)-Number(dateold))/output.time
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: calc_will }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                event_logger += ` -${calc_will.toFixed(2)}${icotransl_list[output.name].smile} `
                console.log('Успешное потребление Археологического центра нафиг')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    return `${event_logger}`
}

async function Laboratory_Controller(user: User, builder: Builder, id_planet: number) {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { event_logger += `🔔🔕 Для работы ${builder.name}-${builder.id} нужна планета\n`; return event_logger }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)

    let global_koef = 0
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {
        if (require.name == 'worker') {
            const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
            global_koef = worker_check <= Math.floor(require.limit) ? worker_check/Math.floor(require.limit) : 1
            if (worker_check != Math.floor(require.limit)) {
                event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
            }
        }
    }
    event_logger += `\n🔔 ${builder.name}-${builder.id}: `
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {
        if (output.name == 'energy') {
            const calc_will = output.outcome * (Number(datenow)-Number(dateold))/output.time
            await prisma.$transaction([
                prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: calc_will }, update: datenow } }),
                prisma.builder.update({ where: { id: builder.id }, data: { update: datenow } })
            ]).then(([]) => {
                event_logger += ` -${calc_will.toFixed(2)}${icotransl_list[output.name].smile} `
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
                event_logger += ` +${data.toFixed(2)}${icotransl_list[input.name].smile} `
                console.log('Успешная работа Лаборатории')
            })
            .catch((error) => {
                //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { event_logger += `🔔🔕 Для работы ${builder.name}-${builder.id} нужен Склад\n`; return event_logger }
    const inputs_storage: Input[] = JSON.parse(storage.input)
    const output: Output = { name: 'crystal', outcome: 1, koef: 0, time: 0}
    const data = await Resource_Finder_Nafig_Outcome(inputs_storage, output, 'crystal', datenow, dateold, global_koef)
    const crystal_need = Math.floor(output.outcome)
    if ( crystal_need < inputs_storage[data.counter].income && inputs_storage[data.counter].income >= 1 ) {
        inputs_storage[data.counter].income -= crystal_need
        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { crystal: { increment: crystal_need }, update: datenow } }),
            prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage), update: datenow } })
        ]).then(() => {
            event_logger += ` +${crystal_need.toFixed(2)}${icotransl_list['crystal_in'].smile}-->${icotransl_list['crystal'].smile} ` 
        })
        .catch((error) => {
            console.error(`Ошибка: ${error.message}`);
        });
        await Update_Statistics(user, [{ name: 'crystal', value: crystal_need} ])
    }
    return `${event_logger}`
}