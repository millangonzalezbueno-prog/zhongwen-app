"""Serialise lessons.json in the repo's layout: one vocab entry / example per line."""
import json

J = lambda o: json.dumps(o, ensure_ascii=False)

def inline(o):
    return "{ " + ", ".join(f"{J(k)}: {J(x)}" for k, x in o.items()) + " }"

def dump_lessons(lessons):
    out = ["["]
    for li, l in enumerate(lessons):
        out.append("  {")
        keys = list(l.keys())
        for ki, k in enumerate(keys):
            last = ki == len(keys) - 1
            comma = "" if last else ","
            x = l[k]
            if k == "reading":
                out.append('    "reading": {')
                rk = list(x.keys())
                for ri, r in enumerate(rk):
                    rc = "" if ri == len(rk) - 1 else ","
                    if isinstance(x[r], list):
                        out.append(f"      {J(r)}: [")
                        out += [f"        {J(p)}," for p in x[r]]
                        out[-1] = out[-1].rstrip(",")
                        out.append(f"      ]{rc}")
                    else:
                        out.append(f"      {J(r)}: {J(x[r])}{rc}")
                out.append(f"    }}{comma}")
            elif k == "vocab":
                out.append('    "vocab": [')
                out += [f"      {inline(v)}," for v in x]
                out[-1] = out[-1].rstrip(",")
                out.append(f"    ]{comma}")
            elif k == "grammar":
                out.append('    "grammar": [')
                for gi, g in enumerate(x):
                    out.append("      {")
                    gk = list(g.keys())
                    for gki, gkey in enumerate(gk):
                        gc = "" if gki == len(gk) - 1 else ","
                        if gkey == "examples":
                            out.append('        "examples": [')
                            out += [f"          {inline(e)}," for e in g[gkey]]
                            out[-1] = out[-1].rstrip(",")
                            out.append(f"        ]{gc}")
                        else:
                            out.append(f"        {J(gkey)}: {J(g[gkey])}{gc}")
                    out.append("      }," if gi < len(x) - 1 else "      }")
                out.append(f"    ]{comma}")
            else:
                out.append(f"    {J(k)}: {J(x)}{comma}")
        out.append("  }," if li < len(lessons) - 1 else "  }")
    out.append("]")
    return "\n".join(out) + "\n"
