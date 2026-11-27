#!/usr/bin/env python3
"""Find an element on the emulator screen with `uiautomator dump` and print its center.

Usage: ui.py find "add-meter|Add a meter"   -> prints "x y", exit 1 when not found
       ui.py has "Ajouter un compteur"       -> exit 0 when an element matches
       ui.py dump                            -> prints the texts on screen (debug)
An element matches when its resource-id, content-desc or text equals one of the |-separated names.
"""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET


def dump() -> ET.Element:
    for _ in range(5):
        subprocess.run(['adb', 'shell', 'uiautomator', 'dump', '/sdcard/ui.xml'], capture_output=True)
        out = subprocess.run(['adb', 'exec-out', 'cat', '/sdcard/ui.xml'], capture_output=True).stdout
        try:
            return ET.fromstring(out)
        except ET.ParseError:
            time.sleep(1)
    raise SystemExit('uiautomator dump failed')


def matches(node: ET.Element, names: list[str]) -> bool:
    rid = node.get('resource-id', '')
    values = {rid, rid.split('/')[-1], node.get('content-desc', ''), node.get('text', '')}
    return any(n in values for n in names)


def main() -> None:
    cmd = sys.argv[1]
    root = dump()
    if cmd == 'dump':
        for n in root.iter('node'):
            label = n.get('text') or n.get('content-desc') or ''
            if label or n.get('resource-id'):
                print(n.get('resource-id', ''), '|', label, '|', n.get('bounds'))
        return
    names = sys.argv[2].split('|')
    for n in root.iter('node'):
        if matches(n, names):
            if cmd == 'has':
                return
            x1, y1, x2, y2 = map(int, re.findall(r'\d+', n.get('bounds', '')))
            print((x1 + x2) // 2, (y1 + y2) // 2)
            return
    sys.exit(1)


if __name__ == '__main__':
    main()
