import { HearManager } from "@vk-io/hear";
import { root, vk } from "./index";
import { IQuestionMessageContext } from "vk-io-question";


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
    /*hearManager.hear(/стата/, async (context: any) => {
        await context.send()
    })*/
}