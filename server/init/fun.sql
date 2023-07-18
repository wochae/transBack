-- table generated
BEGIN;
CREATE TABLE "user"( "id" SERIAL NOT NULL, "nickname" character varying NOT NULL, CONSTRAINT "UQ_e2364281027b926b879fa2fa1e0" UNIQUE ("nickname"), CONSTRAINT "PK_02d3e2d8f2e68c63bbd7fc000cf" PRIMARY KEY ("id"));
CREATE TABLE "channel"("id" SERIAL NOT NULL, "channelName" varying NOT NULL, "type" INTEGER NOT NULL, "onwer" INTEGER, "password" character varying, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id") );
CREATE TABLE "channel_member"( "id" SERIAL NOT NULL, "channelType" INTEGER NOT NULL, "channelId" INTEGER, "userIdx" INTEGER NOT NULL, CONSTRAINT "PK_a4a716289e5b0468f55f8e8d225" PRIMARY KEY ("id"));
CREATE TABLE "message"( "idx" SERIAL NOT NULL, "channelId" INTEGER NOT NULL, "sender" INTEGER NOT NULL, "message" varying NOT NULL, CONSTRAINT "PK_ff281d03b9fc50d48ce27d40466" PRIMARY KEY ("idx"));

-- constraint fk

-- juser
INSERT INTO PUBLIC."user" (idx, nickname, intra) VALUES (1, 'jujeon', 'jujeon');
INSERT INTO PUBLIC."user" (idx, nickname, intra) VALUES (2, 'bujeon', 'bujeon');
INSERT INTO PUBLIC."user" (idx, nickname, intra) VALUES (3, 'juhu', 'juhu');
INSERT INTO PUBLIC."user" (idx, nickname, intra) VALUES (4, 'buhu', 'buhu');

-- channel
INSERT INTO PUBLIC."channel" (id, "channelName", onwer, password) VALUES (1, 'DM', 1, null);

-- channel_members
INSERT INTO PUBLIC."channel_member" (id, "userIdx", "channelType", "channelId") VALUES (1, 0, 0, 1);
INSERT INTO PUBLIC."channel_member" (id, "userIdx", "channelType", "channelId") VALUES (2, 1, 0, 1);

-- message
INSERT INTO PUBLIC."message" (idx, "channelId", sender, message) VALUES (1, 1, 0, 'content');
