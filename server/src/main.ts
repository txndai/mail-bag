import path from "path";
import express, { Express, NextFunction, Request, Response } from "express";
import { serverInfo } from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./Contacts";
import { IContact } from "./Contacts";

const app = express()

// middlewear - it's like underwear, except you wear it in the middle - Scott Mos
app.use(express.json())

//web server - The static middleware is another built-in middleware that Express provides for serving static resources.
app.use("/", express.static(path.join(__dirname, "../../client/dist")))

// adding this little bit of custom middleware ensures that all
// requests to our Express server will be allowed
app.use(function(inRequest: Request, inResponse: Response, inNext: NextFunction) {
    inResponse.header("Access-Control-Allow-Origin", "*");
    inResponse.header("Access-Control-Allow-Methods",
    "GET,POST,DELETE,OPTIONS"
    );
    inResponse.header("Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept"
    );
    inNext();
    });

app.get("/mailboxes",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
            inResponse.json(mailboxes);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);

app.get("/mailboxes/:mailbox",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messages: IMAP.IMessage[] = await imapWorker.listMessages({mailbox : inRequest.params.mailbox});
            inResponse.json(messages);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);
app.get("/mailboxes/:mailbox/:id",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messageBody: string = await imapWorker.getMessageBody({mailbox : inRequest.params.mailbox, id : parseInt(inRequest.params.id, 10)});
            inResponse.json(messageBody);
        } catch (inError) {
            inResponse.send("error");
        }
    }
);
app.delete("/mailboxes/:mailbox/:id",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            await imapWorker.deleteMessage({mailbox : inRequest.params.mailbox, id : parseInt(inRequest.params.id, 10)});
                inResponse.send("ok");
        } catch (inError) {
            inResponse.send("error");
        }
    }
);
app.post("/messages",
    async (inRequest: Request, inResponse: Response) => {
        try {
            const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo)
            await smtpWorker.sendMessage(inRequest.body)
            inResponse.send("would you look at that, your message actually sent")
        } catch(inError) {
            inResponse.send("error")
        }
    }
)

//mailbox & message functionality done, time to turn to the contact endpoints
app.get("/contacts",
async (inRequest: Request, inResponse: Response) => {
    try {
        const contactsWorker: Contacts.Worker = new Contacts.Worker(serverInfo)
        const contacts: IContact[] = await contactsWorker.listContacts()
        inResponse.json(contacts)
    } catch(inError) {
        inResponse.send("error")
    }
}
)
//add contact
app.post("/contacts",
  async (inRequest: Request, inResponse: Response) => {
    console.log("POST /contacts", inRequest.body);
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      const contact: IContact = await contactsWorker.addContact(inRequest.body);
      console.log("POST /contacts: Ok", contact);
      inResponse.json(contact);
    } catch (inError) {
      console.log("POST /contacts: Error", inError);
      inResponse.send("error");
    }
  }
);
//delete contact
app.delete("/contacts/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("DELETE /contacts", inRequest.body);
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      await contactsWorker.deleteContact(inRequest.params.id);
      console.log("Contact deleted");
      inResponse.send("ok");
    } catch (inError) {
      console.log(inError);
      inResponse.send("error");
    }
  }
);