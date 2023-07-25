import { HearManager } from "@vk-io/hear";
import { root, vk } from "./index";
import { IQuestionMessageContext } from "vk-io-question";
import prisma from "./module/prisma";


export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/енотик/, async (context: any) => {
        if (context.senderId == root) {
            await context.sendDocuments({ value: `./prisma/dev.db`, filename: `dev.db` }, { message: '💡 Открывать на сайте: https://sqliteonline.com/' } );
            await vk.api.messages.send({
                peer_id: root,
                random_id: 0,
                message: `‼ @id${context.senderId}(Admin) делает бекап баз данных dev.db.`
            })
        }
    })
    hearManager.hear(/стата|Стата/gm, async (context: any) => {
        let users = 'Рейтинг по добытой энергии\n\n'
        let counter = 1
        let user_me = null
        for (const user of await prisma.analyzer.findMany({ orderBy: { energy: 'desc' }, include: { user: true } })) {
            if (counter <= 10) {
                users += `${counter} - ${user.user.name.slice(0, 20)} --> ${user.energy.toFixed(2)}⚡\n`
            }
            if (user.user.idvk == context.senderId) { user_me = `\n${counter} - @id${user.user.idvk}(${user.user.name.slice(0, 20)}) --> ${user.energy.toFixed(2)}⚡`}
            counter++
        }
        /*const text = [
            { idvk: 1, id: 1, text: "Г", white: " " },
            { idvk: 12, id: 1, text: "ГИ", white: " " },
            { idvk: 123, id: 1, text: "ГИЛ", white: " " },
            { idvk: 1234, id: 1, text: "ГИЛЬ", white: " " },
            { idvk: 12345, id: 1, text: "ГИЛЬД", white: " " },
            { idvk: 123456, id: 1, text: "ГИЛЬДИ", white: " " },
            { idvk: 1234567, id: 1, text: "ГИЛЬДИЯ", white: " " }
        ]
        let res = []
        //const speca = ["ᅠ", " ", " ", "　", " ", " ", "", " "]
        const speca = ["ㅤ"]
        for (const j in speca) {
            for (const i in text) {
                const calc = text[i].text.length < 8 ? 8-text[i].text.length : 0
                const data = `${i}.${(text[i].text).slice(-8)}${text[i].white.repeat(calc)+text[i].white.repeat(3)}${String(text[i].idvk)}🎖`
                res.push({ test: data.replace(/ /g, `${speca[j]}`)})
            }
            res.push({ test: speca[j] })
        }
        await context.send(res.map((item: { test: any; }) => {return item.test;}).join("\r\n"))
        //console.log(res.map((item: { test: any; }) => {return item.test;}).join("\r\n"))*/
        users += user_me
        await context.send(`${users}.`)
    })
    hearManager.hear(/осмотреть|Осмотреть/gm, async (context: any) => {
        if (context.forwards[0].senderId) {
            const user = await prisma.user.findFirst({ where: { idvk: context.forwards[0].senderId } })
            if (user) {
                await context.send(`💬 Промышленный шпионаж показал, что это бизнес, ${user.name}:\n🌐 Корпорация: ${user.id_corportation == 0? 'Не в корпорации' : 'Корпа'}\n📈 Уровень: ${user.lvl}\n💰 Шекели: ${user.gold.toFixed(2)}\n⚡ Энергия: ${user.energy.toFixed(2)}`)
            }
        }
        //console.log(context.forwards[0].senderId)
    })
}