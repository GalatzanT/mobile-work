import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem,
} from "@ionic/react";
import { getLogger } from "../core";
import { ItemContext } from "./MasinaProvider";
import { RouteComponentProps } from "react-router";
import { MasinaProps } from "./MasinaProps";

const log = getLogger("MasinaEdit");

interface MasinaEditProps
  extends RouteComponentProps<{
    id?: string;
  }> {}

const MasinaEdit: React.FC<MasinaEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem } = useContext(ItemContext);
  const [marca, setMarca] = useState("");
  const [model, setModel] = useState("");
  const [item, setItem] = useState<MasinaProps>();

  useEffect(() => {
    const routeId = match.params.id || "";
    const item = items?.find((it) => it.id === routeId);
    setItem(item);
    if (item) {
      setMarca(item.marca);
      setModel(item.model);
    }
  }, [match.params.id, items]);

  const handleSave = useCallback(() => {
    const editedItem: MasinaProps = item
      ? { ...item, marca, model }
      : {
          marca,
          model,
          culoare: "alb",
          an: 2024,
          nrInmatriculare: "CJ-00-XXX",
        };

    log("Saving:", editedItem);
    saveItem && saveItem(editedItem).then(() => history.goBack());
  }, [item, saveItem, marca, model, history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{item ? "Edit" : "Add"} Masina</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>Save</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel position="floating">Marca</IonLabel>
          <IonInput
            value={marca}
            onIonInput={(e) => setMarca(e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Model</IonLabel>
          <IonInput
            value={model}
            onIonInput={(e) => setModel(e.detail.value || "")}
          />
        </IonItem>

        <IonLoading isOpen={saving} />
        {savingError && (
          <div style={{ color: "red", padding: "10px" }}>
            {savingError.message || "Failed to save"}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MasinaEdit;
