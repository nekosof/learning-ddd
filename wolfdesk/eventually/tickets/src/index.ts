import { app, bootstrap, store } from "@rotorsoft/eventually";
import { ExpressApp } from "@rotorsoft/eventually-express";
import {
  PostgresProjectorStore,
  PostgresStore,
} from "@rotorsoft/eventually-pg";
import { Assignment } from "./assignment.policy";
import { Delivery } from "./delivery.policy";
import { RequestedEscalation } from "./requested-escalation.policy";
import { Ticket } from "./ticket.aggregate";
import { TicketProjection, Tickets } from "./ticket.projector";

bootstrap(async () => {
  await store(PostgresStore("tickets"));
  await store().seed();

  const pgTicketProjectorStore = PostgresProjectorStore<TicketProjection>(
    "tickets_projection",
    {
      id: 'varchar(100) COLLATE pg_catalog."default" NOT NULL PRIMARY KEY',
      productId: 'varchar(100) COLLATE pg_catalog."default"',
      supportCategoryId: 'varchar(100) COLLATE pg_catalog."default"',
      escalationId: 'varchar(100) COLLATE pg_catalog."default"',

      priority: 'varchar(10) COLLATE pg_catalog."default"',
      title: 'varchar(100) COLLATE pg_catalog."default"',
      messages: "integer",

      userId: 'varchar(100) COLLATE pg_catalog."default"',
      agentId: 'varchar(100) COLLATE pg_catalog."default"',
      resolvedById: 'varchar(100) COLLATE pg_catalog."default"',
      closedById: 'varchar(100) COLLATE pg_catalog."default"',

      reassignAfter: "timestamptz",
      escalateAfter: "timestamptz",
      closeAfter: "timestamptz",
    },
    `
    CREATE INDEX IF NOT EXISTS tickets_user_ix ON public.tickets_projection USING btree ("userId" ASC) TABLESPACE pg_default;
    CREATE INDEX IF NOT EXISTS tickets_agent_ix ON public.tickets_projection USING btree ("agentId" ASC) TABLESPACE pg_default;
    `
  );
  await pgTicketProjectorStore.seed();

  app(new ExpressApp())
    .with(Ticket)
    .with(Assignment)
    .with(Delivery)
    .with(RequestedEscalation)
    .with(Tickets)
    .withStore(Tickets, pgTicketProjectorStore)
    .build();
  await app().listen();
});
