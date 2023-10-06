import { User, Builder, Planet, Corporation, Corporation_Builder } from "@prisma/client"
import { Context } from "vk-io"
import prisma from "../../prisma";
import { Storages, builder_config } from "../datacenter/builder_config";
import Generator_Nickname from "../../../module/fab/generator_name";
import { Randomizer_Float } from "../service";
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
    let analitica = { res: { coal: 0, gas: 0, oil: 0, uranium: 0, iron: 0, golden: 0, artefact: 0, crystal_dirt: 0 }, mat: { gold: 0, metal: 0, energy: 0, crystal: 0, research: 0 } }
    for (const builder of await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet } })) {
        const result = await Builder_Lifer(user, builder, id_planet, analitica);
        calc += result.message
        analitica = result.analitica
    } 
    calc += `\n\n⚙ Ресурсы:\n${analitica.res.coal.toFixed(2)}${icotransl_list['coal'].smile} ${analitica.res.golden.toFixed(2)}${icotransl_list['golden'].smile}\n${analitica.res.iron.toFixed(2)}${icotransl_list['iron'].smile} ${analitica.res.crystal_dirt.toFixed(2)}${icotransl_list['crystal_dirt'].smile}\n${analitica.res.artefact.toFixed(2)}${icotransl_list['artefact'].smile} ${analitica.res.gas.toFixed(2)}${icotransl_list['gas'].smile}\n${analitica.res.oil.toFixed(2)}${icotransl_list['oil'].smile} ${analitica.res.uranium.toFixed(2)}${icotransl_list['uranium'].smile}`
    calc += `\n\n⚙ Материалы:\n${analitica.mat.energy.toFixed(2)}${icotransl_list['energy'].smile} ${analitica.mat.metal.toFixed(2)}${icotransl_list['metal'].smile} ${analitica.mat.gold.toFixed(2)}${icotransl_list['gold'].smile}\n${analitica.mat.research.toFixed(2)}${icotransl_list['research'].smile} ${analitica.mat.crystal.toFixed(2)}${icotransl_list['crystal'].smile}`
    return calc
}
type Builder_Selector = {
    [key: string]: (user: User, builder: Builder, id_planet: number, analitica: Analitica) => Promise<{ message: string, analitica: Analitica }>;
}
interface Analitica {
    res: { 
        coal: number, 
        gas: number, 
        oil: number, 
        uranium: number, 
        iron: number, 
        golden: number, 
        artefact: number, 
        crystal_dirt: number 
    }, 
    mat: { 
        gold: number,
        metal: number, 
        energy: number, 
        crystal: number, 
        research: number 
    }
}
export async function Builder_Lifer(user: User, builder: Builder, id_planet: number, analitica: Analitica ): Promise<{ message: string, analitica: Analitica }> {
    const calc = { message: '', analitica: analitica }
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
        console.log(`Запуск обработки ${builder.name} для пользователя ${user.id} на планете ${id_planet}`)
        const answer = await config[builder.name](user, builder, id_planet, calc.analitica)
        calc.message += answer.message
        calc.analitica = answer.analitica
    } catch (e) {
        console.log(`Нет такой постройки  ${e}`)
    }
    return calc
}

async function Mine_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return { message: event_logger, analitica: analitica } }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
    const coal_profit = storage_base.coal.count+coal_income_will  <= (storage_base.coal.limit*((storage.lvl)**storage_base.coal.koef_limit)) && planet.coal  >= coal_income_will ? coal_income_will : 0
    const golden_profit = storage_base.golden.count+golden_income_will  <= (storage_base.golden.limit*((storage.lvl)**storage_base.golden.koef_limit)) && planet.golden  >= golden_income_will ? golden_income_will : 0
    const iron_profit = storage_base.iron.count+iron_income_will  <= (storage_base.iron.limit*((storage.lvl)**storage_base.iron.koef_limit)) && planet.iron  >= iron_income_will ? iron_income_will : 0
    const gas_profit = storage_base.gas.count+gas_income_will  <= (storage_base.gas.limit*((storage.lvl)**storage_base.gas.koef_limit)) && planet.gas  >= gas_income_will ? gas_income_will : 0
    const oil_profit = storage_base.oil.count+oil_income_will  <= (storage_base.oil.limit*((storage.lvl)**storage_base.oil.koef_limit)) && planet.oil  >= oil_income_will ? oil_income_will : 0
    const artefact_profit = storage_base.artefact.count+artefact_income_will  <= (storage_base.artefact.limit*((storage.lvl)**storage_base.artefact.koef_limit)) && planet.artefact  >= artefact_income_will ? artefact_income_will : 0
    const crystal_dirt_profit = storage_base.crystal_dirt.count+crystal_dirt_income_will  <= (storage_base.crystal_dirt.limit*((storage.lvl)**storage_base.crystal_dirt.koef_limit)) && planet.crystal  >= crystal_dirt_income_will ? crystal_dirt_income_will : 0
    const uranium_profit = storage_base.uranium.count+uranium_income_will  <= (storage_base.uranium.limit*((storage.lvl)**storage_base.uranium.koef_limit)) && planet.uranium  >= uranium_income_will ? uranium_income_will : 0
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
        analitica.res.artefact += artefact_profit
        analitica.res.coal += coal_profit
        analitica.res.crystal_dirt += crystal_dirt_profit
        analitica.res.gas += gas_profit
        analitica.res.golden += golden_profit
        analitica.res.iron += iron_profit
        analitica.res.oil += oil_profit
        analitica.res.uranium += uranium_profit
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
        analitica.mat.energy -= energy
    })
    .catch((error) => {
        console.error(`Ошибка потребления ${builder.name}-${builder.id}: ${error.message}`);
    });
    return { message: event_logger, analitica: analitica }
}

async function Powerstation_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return { message: event_logger, analitica: analitica } }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
        analitica.res.coal -= coal_outcome
        analitica.mat.energy += energy_income
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'energy', value: energy_income}])
    }
    return { message: event_logger, analitica: analitica }
}

async function Powerstation_Solar_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
        analitica.mat.energy += energy_income
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'energy', value: energy_income}])
    }
    return { message: event_logger, analitica: analitica }
}

async function Central_Bank_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return { message: event_logger, analitica: analitica } }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
        analitica.res.golden -= golden_outcome
        analitica.mat.energy -= energy_outcome
        analitica.mat.gold += gold_income
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'gold', value: gold_income}])
    }
    
    const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
    const corp_build: Corporation_Builder[] = await prisma.corporation_Builder.findMany({ where: { id_corporation: user.id_corporation } })
    if (corp_build.length < 1 || !corp) { return { message: event_logger, analitica: analitica } }
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
        analitica.mat.gold += gold_bonus_user
    })
    .catch((error) => {
        console.error(`Ошибка при работе с корпорацией в ${builder.name}-${builder.id}: ${error.message}`);
    });
    return { message: event_logger, analitica: analitica }
}

async function Factory_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return { message: event_logger, analitica: analitica } }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
    const iron_outcome = storage_base.iron.count-iron_outcome_will > 0 ? iron_outcome_will : 0
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
        analitica.res.iron -= iron_outcome
        analitica.mat.energy -= energy_outcome
        analitica.mat.metal += metal_income
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'iron', value: metal_income}])
    }
    return { message: event_logger, analitica: analitica }
}

async function City_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    const energy_outcome = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy_outcome } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        analitica.mat.energy -= energy_outcome
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    // считаем количество рабочих, которых можно поселить на этой планете
    const cities = await prisma.builder.findMany({ where: { id_user: user.id, id_planet: planet.id, name: "Города" } })
    let worker_count_city = 0
    for (const city of cities) {
        worker_count_city += Math.floor(builder_config[city.name].storage!.worker.limit*((city.lvl)**builder_config[city.name].storage!.worker.koef_limit))
        
    }
    const worker_count_planet = await prisma.worker.count({ where: { id_planet: id_planet, id_user: user.id } })
    let worker_limiter = worker_count_city - worker_count_planet
    if (worker_count_planet < worker_count_city) {
        // эвакуация рабочих с потерянных планет
        for (const worker of await prisma.worker.findMany({ where: { id_user: user.id } })) {
            if (worker.id_planet != id_planet ) {
                const worker_planet_check = await prisma.planet.findFirst({ where: { id: worker.id_planet || -1 } })
                if (!worker_planet_check && worker_limiter > 0) {
                    await prisma.$transaction([
                        prisma.worker.update({ where: { id: worker.id }, data: { id_planet: id_planet, update: datenow, id_builder: 0 } }),
                    ]).then(([]) => {
                        console.log(`Города успешно выявили рабочего ${worker.name}-${worker.id} с несуществующих планет и эвакуировали на ${planet.name}-${planet.id}`)
                        worker_limiter--
                    }).catch((error) => {
                        console.error(`Ошибка эвакуации рабочих на ${planet.name}-${planet.id}: ${error.message}`);
                    });
                }
            }
        }
        // докупка рабочих
        while (worker_limiter > 0) {
            await prisma.$transaction([
                prisma.worker.create({ data: { id_user: user.id, name: await Generator_Nickname(), id_planet: id_planet } }),
            ]).then(([worker_new]) => {
                console.log(`Города успешно наняли недостающего рабочего ${worker_new.name}-${worker_new.id} на ${planet.name}-${planet.id}`)
                worker_limiter--
            }).catch((error) => {
                console.error(`Ошибка: ${error.message}`);
            });
        }
    }
    // модуль трудоустройства на работу рабочих
    const builder_on_planet: Builder[] = await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet } })
    for (const builderplan of builder_on_planet) {
        const worker_on_builder_need = Math.floor(builder_config[builderplan.name].require!.worker.limit*((builderplan.lvl)**builder_config[builderplan.name].require!.worker.koef))
        const worker_on_builder_be = await prisma.worker.count({ where: { id_builder: builderplan.id, id_user: user.id, id_planet: id_planet } })
        if (worker_on_builder_be < worker_on_builder_need) {
            let limiter_list = worker_on_builder_need - worker_on_builder_be
            for (const worker_sel of await prisma.worker.findMany({ where: { id_user: user.id, id_planet: id_planet } })) {
                const worker_clear = await prisma.builder.findFirst({ where: { id: worker_sel.id_builder || 0 } })
                if (!worker_clear && limiter_list > 0) {
                    await prisma.$transaction([
                        prisma.worker.update({ where: { id: worker_sel.id }, data: { update: datenow, id_builder: builderplan.id } }),
                    ]).then(([]) => {
                        console.log(`Города успешно выявили безработного ${worker_sel.name}-${worker_sel.id} и устроили на работу в ${builderplan.name}-${builderplan.id} на ${planet.name}-${planet.id}`)
                        limiter_list--
                    }).catch((error) => {
                        console.error(`Ошибка: ${error.message}`);
                    });
                }
            }
        }
    }
    return { message: event_logger, analitica: analitica }
}

async function Storage_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const builse = builder_config[builder.name]
    const worker_check = await prisma.worker.count({ where: { id_builder: builder.id } })
    const worker_calc = builse.require.worker.limit*(builder.lvl**builse.require.worker.koef)
    const global_koef =  worker_check <= Math.floor(worker_calc) ? worker_check/Math.floor(worker_calc) : 1
    if (worker_check != Math.floor(worker_calc)) {
        event_logger += `🔕 Для работы ${builder.name}-${builder.id} нужно больше рабочих\n`;
    }
    // просчитываем потребление за прошедшее время
    const energy_outcome = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy_outcome } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } })
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        analitica.mat.energy -= energy_outcome
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    return { message: event_logger, analitica: analitica }
}

async function Archaeological_Center_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return { message: event_logger, analitica: analitica } }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
    const artefact_outcome_will = Math.floor(((builse.output!.artefact.outcome*((builder.lvl)**builse.output!.artefact.koef))) * global_koef)
    const artefact_outcome = storage_base.artefact.count-artefact_outcome_will > 0 ? artefact_outcome_will : storage_base.artefact.count-1 > 0 ? 1 : 0
    storage_base.artefact.count -= artefact_outcome
    const energy_outcome = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    // просчитываем прибыль за прошедшее время
    let metal_art = 0
    let gold_art = 0
    let energy_art = 0
    let build_art = 0
    if (artefact_outcome >= 1) {
        for (let i= 0; i < artefact_outcome; i++) {
            metal_art += await Randomizer_Float(0, ((builse.input!.metal.income*((builder.lvl)**builse.input!.metal.koef))) * global_koef)
            gold_art += await Randomizer_Float(0, ((builse.input!.gold.income*((builder.lvl)**builse.input!.gold.koef))) * global_koef)
            energy_art += await Randomizer_Float(0, ((builse.input!.energy.income*((builder.lvl)**builse.input!.energy.koef))) * global_koef)
            build_art += await Randomizer_Float(0, 1000) > 900 ? ((builse.input!.builder_block.income*((builder.lvl)**builse.input!.builder_block.koef))) : 0
        }
    }
    let succeser = false
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { storage: JSON.stringify(storage_base) } }),
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy_outcome } } }),
        prisma.user.update({ where: { id: user.id }, data: { energy: { increment: energy_art },  gold: { increment: gold_art }, iron: { increment: metal_art } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } }),
        prisma.planet.update({ where: { id: id_planet }, data: { update: datenow, build: { increment: build_art } } }),
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        if (build_art > 0) {
            Send_Message(chat_id, `🌟 Поздравляем [https://vk.com/id${user.idvk}|${user.name}] c прокачкой Планеты-${planet.id} на ${build_art} площадки`)
            event_logger += `\n🔔 ${builder.name}-${builder.id}: +${metal_art.toFixed(2)}${icotransl_list['metal'].smile}, +${gold_art.toFixed(2)}${icotransl_list['gold'].smile}, +${energy_art.toFixed(2)}${icotransl_list['energy'].smile} +${build_art}${icotransl_list['builder_block'].smile} \n` 
        } 
        if (storage_base.artefact.count >= 1) {
            event_logger += `\n🔔 ${builder.name}-${builder.id}: на складе осталось ${storage_base.artefact.count.toFixed(2)} артефактов\n`
        }
        console.log(`C артефактов выпало: ${builder.name}-${builder.id}: +${metal_art.toFixed(2)}${icotransl_list['metal'].smile}, +${gold_art.toFixed(2)}${icotransl_list['gold'].smile}, +${energy_art.toFixed(2)}${icotransl_list['energy'].smile} +${build_art}${icotransl_list['builder_block'].smile}\n`);
        succeser = true
        analitica.res.artefact -= artefact_outcome
        analitica.mat.energy -= energy_outcome
        analitica.mat.metal += metal_art
        analitica.mat.gold += gold_art
        analitica.mat.energy += energy_art
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'iron', value: metal_art }, { name: 'gold', value: gold_art }, { name: 'energy', value: energy_art }, { name: 'artefact', value: artefact_outcome}, { name: 'build', value: build_art }])
    }
    return { message: event_logger, analitica: analitica }
}

async function Laboratory_Controller(user: User, builder: Builder, id_planet: number, analitica: Analitica): Promise<{ message: string, analitica: Analitica }> {
    let event_logger = ''
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { return { message: event_logger, analitica: analitica } }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { return { message: event_logger, analitica: analitica } }
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
    const crystal_dirt_outcome_will = Math.floor(((builse.output!.crystal_dirt.outcome*((builder.lvl)**builse.output!.crystal_dirt.koef))) * global_koef)
    const crystal_dirt_outcome = storage_base.crystal_dirt.count-crystal_dirt_outcome_will > 0 ? crystal_dirt_outcome_will : storage_base.crystal_dirt.count-1 > 0 ? 1 : 0
    storage_base.crystal_dirt.count -= crystal_dirt_outcome
    const energy_outcome = ((builse.output!.energy.outcome*((builder.lvl)**builse.output!.energy.koef))*(Number(datenow)-Number(dateold))/builse.output!.energy.time) * global_koef
    // просчитываем прибыль за прошедшее время
    const koef_crystal = crystal_dirt_outcome/crystal_dirt_outcome_will
    const crystal_income = ((builse.input!.crystal.income*((builder.lvl)**builse.input!.crystal.koef))) * global_koef * koef_crystal
    const research_income = ((builse.input!.research.income*((builder.lvl)**builse.input!.research.koef))*(Number(datenow)-Number(dateold))/builse.input!.research.time) * global_koef
    let succeser = false
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { storage: JSON.stringify(storage_base) } }),
        prisma.user.update({ where: { id: user.id }, data: { energy: { decrement: energy_outcome }, crystal: { increment: crystal_income }, research: { increment: research_income } } }),
        prisma.builder.update({ where: { id: builder.id }, data: { update: new Date(datenow) } }),
    ]).then(([]) => {
        console.log(`Успешная работа ${builder.name}-${builder.id}`)
        succeser = true
        analitica.res.crystal_dirt -= crystal_dirt_outcome
        analitica.mat.energy -= energy_outcome
        analitica.mat.research += research_income
        analitica.mat.crystal += crystal_income
    })
    .catch((error) => {
        console.error(`Ошибка работы ${builder.name}-${builder.id}: ${error.message}`);
    });
    if (succeser) {
        await Update_Statistics(user, [{ name: 'crystal', value: crystal_income }, { name: 'research', value: research_income }])
    }
    return { message: event_logger, analitica: analitica }
}