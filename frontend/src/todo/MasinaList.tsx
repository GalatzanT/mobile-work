import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { add } from "ionicons/icons";
import Masina from "./Masina";
import { getLogger } from "../core";
import { ItemContext } from "./MasinaProvider";

const log = getLogger("ItemList");

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError } = useContext(ItemContext);
  log("render");
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Masini</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {items && (
          <IonList>
            {items.map((item) => (
              <Masina
                key={item.id}
                id={item.id}
                marca={item.marca}
                model={item.model}
                an={item.an}
                culoare={item.culoare}
                nrInmatriculare={item.nrInmatriculare}
                onEdit={(id) => history.push(`/masina/${id}`)}
              />
            ))}
          </IonList>
        )}
        {fetchingError && (
          <div>{fetchingError.message || "Failed to fetch items"}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push("/masina")}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default ItemList;
