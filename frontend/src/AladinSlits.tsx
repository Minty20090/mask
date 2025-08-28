import React, { useEffect, useRef, useState, useMemo } from "react";
import { Table, Tabs, ScrollArea} from "@mantine/core";

declare global {
  interface Window {
    A?: any; // Aladin global variable
  }
}

type AladinSlitsProps = {
  userId: string;
  projectName: string;
  maskName: string;
};

interface ObjectRecords {
  id: number;
  name: string;
  type: string;
  a_len: number;
  b_len: number;
  declination: number;
  right_ascension: number;
  priority: number;
}

interface ApiResponse {
  excluded_obj_list: ObjectRecords[];
  obj_list: ObjectRecords[];
  features: Slit[];
  center_ra: string;
  center_dec: string;
}

type Slit = {
  type: string;
  id: string;
  ra: string;
  dec: string;
  x: number;
  y: number;
  width: number;
  a_len: number;
  b_len: number;
  angle: number;
};

// --- utils -------------------------------------------------------
function raStringToDeg(raStr: string): number {
  const [h, m, s] = raStr.split(":").map(Number);
  return (h + m / 60 + s / 3600) * 15;
}

function decStringToDeg(decStr: string): number {
  let sign = 1;
  let t = decStr.trim();
  if (t.startsWith("-")) {
    sign = -1;
    t = t.slice(1);
  } else if (t.startsWith("+")) {
    t = t.slice(1);
  }
  const [d, m, s] = t.split(":").map(Number);
  return sign * (d + m / 60 + s / 3600);
}

function arcminToDeg(v: number): number {
  return v / 60;
}

function computeRectangleCorners(
  ra: number,
  dec: number,
  widthDeg: number,
  heightDeg: number,
  angleDeg: number
): [number, number][] {
  const ang = (angleDeg * Math.PI) / 180;
  const w2 = widthDeg / 2;
  const h2 = heightDeg / 2;

  const base = [
    { x: -w2, y: -h2 },
    { x: +w2, y: -h2 },
    { x: +w2, y: +h2 },
    { x: -w2, y: +h2 },
  ];

  return base.map(({ x, y }) => {
    const xr = x * Math.cos(ang) - y * Math.sin(ang);
    const yr = x * Math.sin(ang) + y * Math.cos(ang);
    return [ra + xr, dec + yr];
  });
}

// -----------------------------------------------------------------
export default function AladinSlits({ userId, projectName, maskName }: AladinSlitsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const aladinRef = useRef<any>(null);
  const maskDataRef = useRef<{ center_ra: string; center_dec: string }>({
    center_ra: "10 00 00",
    center_dec: "+02 23 00",
  });

  const [slits, setSlits] = useState<Slit[]>([]);
  const [objList, setObjList] = useState<ObjectRecords[]>([]);
  const [excludedList, setExcludedList] = useState<ObjectRecords[]>([]);
  const [error, setError] = useState(false);

  // Fetch slits, obj_list, and excluded_obj_list
  useEffect(() => {
    async function fetchData() {
      try {
        const url = `/api/masks/${maskName}?project_name=${encodeURIComponent(projectName)}`;
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.warn("Slits not found, skipping Aladin render");
            setError(true);
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        maskDataRef.current = data;
        setSlits(data.features || []);
        setObjList(data.obj_list || []);
        setExcludedList(data.excluded_obj_list || []);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch mask data:", err);
        setError(true);
      }
    }
    fetchData();
  }, [projectName, userId, maskName]);

  // Draw slits on Aladin Lite
  useEffect(() => {
    if (!containerRef.current || slits.length === 0) return;
    if (!window.A || !window.A.init) {
      console.error("Aladin Lite not loaded");
      return;
    }

    let disposed = false;
    window.A.init.then(() => {
      if (disposed || !containerRef.current) return;

      const { center_ra, center_dec } = maskDataRef.current;

      const aladin = window.A.aladin(containerRef.current, {
        survey: "P/DSS2/color",
        fov: 0.1,
        target: `${center_ra} ${center_dec}`,
      });
      aladinRef.current = aladin;

      const overlay = window.A.graphicOverlay({ color: "#ee2345", lineWidth: 1.5 });
      aladin.addOverlay(overlay);

      slits.forEach((slit) => {
        const raDeg = raStringToDeg(slit.ra);
        const decDeg = decStringToDeg(slit.dec);
        const widthDeg = arcminToDeg(slit.width);
        const heightDeg = arcminToDeg(slit.a_len);

        const corners = computeRectangleCorners(raDeg, decDeg, widthDeg, heightDeg, slit.angle);
        const poly = window.A.polygon(corners, {
          strokeColor: "blue",
          fillColor: "rgba(0,0,255,0.2)",
          lineWidth: 2,
        });
        overlay.add(poly);

        const label = window.A.label(raDeg, decDeg, slit.id, { fontSize: 10, color: "#fff" });
        overlay.add(label);
      });
    });

    return () => {
      disposed = true;
    };
  }, [slits]);

  // Render rows helper
  const renderRows = (data: ObjectRecords[]) =>
    data.map((obj, index) => (
      <Table.Tr key={obj.id ?? index}>
        <Table.Td>{index + 1}</Table.Td>
        <Table.Td>{obj.id}</Table.Td>
        <Table.Td>{obj.name}</Table.Td>
        <Table.Td>{obj.type}</Table.Td>
        <Table.Td>{obj.a_len}</Table.Td>
        <Table.Td>{obj.b_len}</Table.Td>
        <Table.Td>{obj.declination}</Table.Td>
        <Table.Td>{obj.right_ascension}</Table.Td>
        <Table.Td>{obj.priority}</Table.Td>
      </Table.Tr>
    ));

  

return (<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
  {error || slits.length === 0 ? (
    <div
      style={{
        height: "70vh",       // 70% of the viewport height
        display: "flex",      // center content vertically and horizontally
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        border: "1px solid #ccc", // optional, just to see the box
      }}
    >
      <p>Preview will load when mask has been generated.</p>
    </div>

  ) : (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "70%", // Preview gets 70%
        border: "1px solid #ccc",
        marginBottom: "10px",
      }}
    />
  )}

  {/* Bottom section with tables in tabs */}
  <div style={{ height: "30%", maxHeight: "300px", display: "flex", flexDirection: "column" }}>
    <Tabs defaultValue="included" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Tabs.List>
        <Tabs.Tab value="included">Included Objects</Tabs.Tab>
        <Tabs.Tab value="excluded">Excluded Objects</Tabs.Tab>
      </Tabs.List>

      {/* Included Objects */}
      <Tabs.Panel value="included" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ScrollArea style={{ flex: 1, maxHeight: "300px" }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>A Len</Table.Th>
                <Table.Th>B Len</Table.Th>
                <Table.Th>Declination</Table.Th>
                <Table.Th>Right Ascension</Table.Th>
                <Table.Th>Priority</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{renderRows(objList)}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Tabs.Panel>

      {/* Excluded Objects */}
      <Tabs.Panel value="excluded" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ScrollArea style={{ flex: 1, maxHeight: "300px" }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>A Len</Table.Th>
                <Table.Th>B Len</Table.Th>
                <Table.Th>Declination</Table.Th>
                <Table.Th>Right Ascension</Table.Th>
                <Table.Th>Priority</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{renderRows(excludedList)}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Tabs.Panel>
    </Tabs>
  </div>
</div>

);
}
