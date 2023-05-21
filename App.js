import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fontisto } from "@expo/vector-icons";
import { SimpleLineIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import * as Haptics from "expo-haptics";
import { theme } from "./color";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "@toDos";
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  const inputRef = React.useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [text, setText] = useState("");
  const [toDos, setToDos] = useState({});
  const [workStatus, setWorkstatus] = useState({});
  const [toEdit, setToEdit] = useState(false);
  const [toEditKey, setToEditKey] = useState(0);
  useEffect(() => {
    loadTodos();
  }, []);
  const onChangeText = (payload) => setText(payload);
  const calcStatus = (obj) => {
    let fullWork = Object.keys(obj).length;
    let finished = Object.keys(obj).filter(
      (k) => obj[k].finished === true
    ).length;
    if (fullWork !== 0) {
      setWorkstatus(finished / fullWork);
    } else {
      setWorkstatus(0);
    }
  };
  const saveToDos = async (toSave) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  };
  const loadTodos = async () => {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    const savedTodos = s !== null ? JSON.parse(s) : JSON.parse({});
    setToDos(savedTodos);
    calcStatus(savedTodos);
    setIsLoading(false);
  };

  const addToDo = async () => {
    let newToDos;
    if (text === "") {
      return;
    }
    if (toEdit) {
      newToDos = toDos;
      newToDos[toEditKey].text = text;
      setToEdit(false);
      setText("");
    } else {
      newToDos = { ...toDos, [Date.now()]: { text, finished: false } };
      setText("");
    }
    setToDos(newToDos);
    calcStatus(newToDos);
    await saveToDos(newToDos);
  };

  const finishToDo = async (key) => {
    const newToDos = { ...toDos };
    newToDos[key].finished = !newToDos[key].finished;
    setToDos(newToDos);
    calcStatus(newToDos);
    await saveToDos(newToDos);
  };
  const deleteToDo = async (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete To Do?", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "I'm Sure",
        style: "destructive",
        onPress: async () => {
          const newToDos = { ...toDos };
          delete newToDos[key];
          setToDos(newToDos);
          calcStatus(newToDos);
          await saveToDos(newToDos);
        },
      },
    ]);
  };
  const editToDo = async (key) => {
    setToEdit(true);
    setToEditKey(key);
    setText(toDos[key].text);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={{ ...styles.btnText, color: "black" }}>Work</Text>
      </View>
      {isLoading ? (
        <View
          style={{
            marginTop: 150,
          }}
        >
          <ActivityIndicator
            color="black"
            style={{ marginTop: 10 }}
            size="large"
          />
        </View>
      ) : (
        <View>
          <View style={styles.progressStatus}>
            <View>
              <Progress.Bar
                progress={workStatus}
                color="black"
                unfilledColor="#A6A8AC"
                borderColor={theme.bg}
                height={4}
                width={SCREEN_WIDTH * 0.7}
              />
            </View>
            <Text style={styles.progressText}>
              {(workStatus * 100).toFixed(0)}%
            </Text>
          </View>
          <View
            style={{
              ...styles.inputContainer,
              borderBottomColor: inputFocused ? "black" : theme.grey,
            }}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              returnKeyType="done"
              placeholder="Add a To Do"
              style={styles.input}
              onSubmitEditing={addToDo}
              onChangeText={onChangeText}
            />
          </View>
          <ScrollView style={{ marginBottom: 30 }}>
            {toDos !== null
              ? Object.keys(toDos).map((key) => (
                  <TouchableOpacity
                    style={styles.toDo}
                    key={key}
                    onLongPress={() => deleteToDo(key)}
                  >
                    <Text
                      style={{
                        ...styles.toDoText,
                        textDecorationLine: toDos[key].finished
                          ? "line-through"
                          : null,
                        color: toDos[key].finished ? "gray" : null,
                      }}
                    >
                      {toDos[key].text}
                    </Text>
                    <TouchableOpacity onPress={() => editToDo(key)}>
                      <SimpleLineIcons name="pencil" size={20} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => finishToDo(key)}>
                      <Fontisto
                        name={
                          toDos[key].finished
                            ? "checkbox-active"
                            : "checkbox-passive"
                        }
                        size={18}
                        color={theme.toDoBg}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 100,
  },
  progressStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  progressText: {
    marginLeft: 20,
    fontWeight: "500",
  },
  btnText: {
    fontSize: 38,
    fontWeight: "600",
  },
  inputContainer: {
    borderBottomWidth: 4,
    borderBottomColor: theme.grey,
    marginBottom: 40,
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 20,
    fontSize: 18,
  },
  toDo: {
    backgroundColor: "white",
    marginBottom: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toDoText: {
    fontSize: 16,
    fontWeight: "400",
    width: "75%",
  },
});
