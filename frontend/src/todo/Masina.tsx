import React, { memo } from "react";
import { IonItem, IonLabel } from "@ionic/react";
import { getLogger } from "../core";
import { MasinaProps } from "./MasinaProps";

const log = getLogger("Item");

interface ItemPropsExt extends MasinaProps {
  onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ id, marca, model, onEdit }) => {
  return (
    <IonItem onClick={() => onEdit(id)}>
      <IonLabel>{model}</IonLabel>
      <IonLabel>{marca}</IonLabel>
    </IonItem>
  );
};

export default memo(Item);
