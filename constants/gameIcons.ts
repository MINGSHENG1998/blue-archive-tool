// In-game item and currency icons, bundled so they render offline and never
// depend on a third-party host. Sourced from SchaleDB's item/currency icon set
// (images/item/icon/<Icon>.webp). Prefer these over text labels: players
// recognise a pyroxene or a 10-pull ticket faster than they read its name.
//
// Add an icon = download the webp into assets/images/icons/ and list it here.

import type { ImageSourcePropType } from "react-native";

export const gameIcons = {
  pyroxene: require("@/assets/images/icons/pyroxene.webp"),
  ap: require("@/assets/images/icons/ap.webp"),
  credit: require("@/assets/images/icons/credit.png"),
  ticket1: require("@/assets/images/icons/ticket_1.webp"),
  ticket10: require("@/assets/images/icons/ticket_10.webp"),
  keystonePiece: require("@/assets/images/icons/keystone_piece.webp"),
  giftBox: require("@/assets/images/icons/gift_box.webp"),
  giftBoxLuxury: require("@/assets/images/icons/gift_box_luxury.webp"),
  raidTicket: require("@/assets/images/icons/raid_ticket.webp"),
  eleph: require("@/assets/images/icons/eleph.png"),
  eligma: require("@/assets/images/icons/eligma.png"),
  secretNote: require("@/assets/images/icons/secret_note.webp"),
  reportPink: require("@/assets/images/icons/pink_book.png"),
  reportOrange: require("@/assets/images/icons/orange_book.png"),
  reportBlue: require("@/assets/images/icons/blue_book.png"),
  reportGrey: require("@/assets/images/icons/grey_book.png"),
  headpat: require("@/assets/images/bondExp/Headpat_Icon.webp"),
} satisfies Record<string, ImageSourcePropType>;

export type GameIconName = keyof typeof gameIcons;
