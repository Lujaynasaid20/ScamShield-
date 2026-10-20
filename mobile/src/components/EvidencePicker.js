import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatBytes } from "@/lib/format";
import { colors, space } from "@/theme";
import { Body, Button } from "./ui";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_WIDTH = 1600;

// Photos are re-encoded as JPEG (which also converts iPhone HEIC photos) and scaled down so they fit the
// server's 2 MB limit. PDFs and text files are attached as they are. The server re-checks every file.
async function preparePhoto(asset, index) {
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  const size = (await (await fetch(saved.uri)).blob()).size;
  const base = (asset.fileName || `screenshot-${index + 1}`).replace(/\.[^.]*$/, "");
  return { uri: saved.uri, name: `${base}.jpg`, type: "image/jpeg", size };
}

export default function EvidencePicker({ files, onChange, max = 5 }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const room = max - files.length;

  const add = (picked, problems) => {
    const fitting = picked.filter(file => file.size <= MAX_BYTES);
    const tooBig = picked.filter(file => file.size > MAX_BYTES).map(file => `${file.name} is larger than 2 MB.`);
    onChange([...files, ...fitting].slice(0, max));
    setError([...problems, ...tooBig, files.length + fitting.length > max ? `Only ${max} files can be attached.` : ""].filter(Boolean).join(" "));
  };

  // The system photo picker only shows the photos the user chooses, so no photo-library permission is needed.
  const pickPhotos = async () => {
    setError("");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: room, quality: 1 });
    if (result.canceled) return;
    setBusy(true);
    const prepared = [];
    const problems = [];
    for (const [index, asset] of result.assets.entries()) {
      try { prepared.push(await preparePhoto(asset, files.length + index)); } catch { problems.push(`${asset.fileName || "A photo"} couldn't be prepared.`); }
    }
    setBusy(false);
    add(prepared, problems);
  };

  const pickDocuments = async () => {
    setError("");
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "text/plain"], multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    add(result.assets.slice(0, room).map(asset => ({ uri: asset.uri, name: asset.name, type: asset.mimeType || "application/octet-stream", size: asset.size || 0 })), []);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Evidence <Text style={s.optional}>(optional)</Text></Text>
      <View style={s.row}>
        <Button small variant="outline" icon="image-outline" title="Add screenshots" onPress={pickPhotos} busy={busy} disabled={room <= 0} style={s.flex} />
        <Button small variant="outline" icon="document-outline" title="PDF or text" onPress={pickDocuments} disabled={room <= 0 || busy} style={s.flex} />
      </View>
      <Body small muted>Up to {max} files, 2 MB each. Hide passwords, PINs and full account numbers first. Only you and administrators can see them.</Body>
      {files.map((file, index) => (
        <View key={`${file.uri}-${index}`} style={s.file}>
          <Ionicons name={file.type.startsWith("image/") ? "image-outline" : "document-text-outline"} size={18} color={colors.ink2} />
          <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={s.size}>{formatBytes(file.size)}</Text>
          <Pressable onPress={() => onChange(files.filter((_, i) => i !== index))} accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} hitSlop={12}>
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </Pressable>
        </View>
      ))}
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: "row", gap: space.sm },
  flex: { flex: 1 },
  label: { fontSize: 14, fontWeight: "700", color: colors.ink2 },
  optional: { fontWeight: "400", color: colors.muted },
  file: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 6 },
  fileName: { flex: 1, fontSize: 14, color: colors.ink },
  size: { fontSize: 13, color: colors.muted },
  error: { fontSize: 13, color: colors.dangerText, fontWeight: "600" }
});
