#!/bin/zsh

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR" || exit 1

clipboard_json="$(pbpaste)"
if [[ -z "${clipboard_json//[[:space:]]/}" ]]; then
  print -u2 "오류: 클립보드에 JSON이 없습니다."
  status=1
else
  print -r -- "$clipboard_json" | npm run render:single -- --stdin
  status=$?
  if (( status == 0 )); then
    open "$SCRIPT_DIR/output"
  fi
fi

print
print "아무 키나 누르면 종료합니다."
read -r -k 1
print
exit $status
