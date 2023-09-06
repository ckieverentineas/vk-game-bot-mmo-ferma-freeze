import { User, Builder, Planet } from "@prisma/client"
import { Context } from "vk-io"
import prisma from "../../prisma";
import { Input } from "../datacenter/builder_config";
import { Send_Message } from "../account/service";

export async function Time_Controller(context: Context, user: User, id_planet: number) {
    for (const builder of await prisma.builder.findMany({ where: { id_user: user.id, id_planet: id_planet } })) {
        const config: Builder_Selector = {
            'Шахты': Mine_Controller,
            /*'Электростанция': Powerstation_Controller,
            'Солнечная электростанция': Powerstation_Solar_Controller,
            'Центробанк': Central_Bank_Controller,
            'Археологический центр': Archaeological_Center_Controller,
            'Лаборатория': Laboratory_Controller,
            'Города': City_Controller,
            'Склад': Storage_Controller,*/
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
async function Mine_Controller(context: Context, user: User, builder: Builder, id_planet: number) {
    const storage: Builder | null = await prisma.builder.findFirst({ where: { id_user: user.id, id_planet: id_planet, name: 'Склад' } })
    if (!storage) { await Send_Message(context.peerId, 'Але, у вас склада нет на базе, вы дома?'); return }
    const planet: Planet | null = await prisma.planet.findFirst({ where: { id: id_planet } })
    if (!planet) { await Send_Message(context.peerId, 'Але, у вас планеты нет на базе, вы дома?'); return }
    const datenow: Date = new Date()
    const dateold: Date = new Date(builder.update)
    const inputs_storage: Input[] = JSON.parse(storage.input)
    const inputs_mine: Input[] = JSON.parse(builder.input)
    //let event_logger = ``
    async function Resource_Finder_Nafig(input_storage: Input[], input_mine: Input, target: string) {
        const data = { income: 0, counter: 0 }
        for (let i=0; i < input_storage.length; i++) {
            const store = input_storage[i]
            if (store.name == target) {
                data.income = input_mine.income * (Number(datenow)-Number(dateold))/input_mine.time
                data.counter = i
            }
        }
        return data
    }
    const income_wil = { coal: 0, gas: 0, oil: 0, slate: 0, turf: 0, uranium: 0, iron: 0, golden: 0, artefact: 0, crystal: 0 }
    for (const input of inputs_mine) {
        if (input.name == 'golden') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'golden')
            if ( data.income < planet.golden ) {
                inputs_storage[data.counter].income += data.income
                income_wil.golden += data.income
            }
        }
        if (input.name == 'iron') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'iron')
            if ( data.income < planet.iron ) {
                inputs_storage[data.counter].income += data.income
                income_wil.iron += data.income
            }
        }
        if (input.name == 'coal') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'coal')
            if ( data.income < planet.coal ) {
                inputs_storage[data.counter].income += data.income
                income_wil.coal += data.income
            }
        }
        if (input.name == 'crystal') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'crystal')
            if ( data.income < planet.crystal ) {
                inputs_storage[data.counter].income += data.income
                income_wil.crystal += data.income
            }
        }
        if (input.name == 'artefact') {
            const data = await Resource_Finder_Nafig(inputs_storage, input, 'artefact')
            if ( data.income < planet.artefact ) {
                inputs_storage[data.counter].income += data.income
                income_wil.artefact += data.income
            }
        }
    }
    console.log(inputs_storage)
    console.log(income_wil)
    await prisma.$transaction([
        prisma.builder.update({ where: { id: storage.id }, data: { input: JSON.stringify(inputs_storage), update: builder.update } }),
        prisma.planet.update({ where: { id: id_planet }, data: { coal: { decrement: income_wil.coal }, gas: { decrement: income_wil.gas }, oil: { decrement: income_wil.oil }, slate: { decrement: income_wil.slate }, turf: { decrement: income_wil.turf }, uranium: { decrement: income_wil.uranium }, iron: { decrement: income_wil.iron }, golden: { decrement: income_wil.golden }, artefact: { decrement: income_wil.artefact }, crystal: { decrement: income_wil.crystal } } })
    ]).then(([]) => {
        console.log('Успешная добыча ресов нафиг')
    })
    .catch((error) => {
        //event_logger = `⌛ Произошла ошибка просчета добычи с шахты, попробуйте позже` 
        console.error(`Ошибка: ${error.message}`);
    });
    /*
    const outputs: Output[] = JSON.parse(builder.output)
    for (const output of outputs) {

    }
    const requires: Require[] = JSON.parse(builder.require)
    for (const require of requires) {

    }
    */
}