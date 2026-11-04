import { DOCUMENT_POSITIONS } from "./escape"
import type { PracticalTask } from "./escape"
import { puzzles } from "./puzzles"
import type { AdventurePuzzle } from "../types/adventure"

export function campaignDeck(seed?: string): readonly AdventurePuzzle[] {
  if (!seed) return puzzles
  let value = 2166136261
  for (const c of seed) value = Math.imul(value ^ c.charCodeAt(0), 16777619) >>> 0
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  }
  const choose = <T>(a: readonly T[]) => a[Math.floor(random() * a.length)]
  const result = puzzles.map((p) => structuredClone(p)) as AdventurePuzzle[]
  for (const p of result) {
    let correct = p.question.answers.find((a) => a.id === p.correctAnswerId)!.label
    if (p.roomId === "classroom") {
      const start = 2 + Math.floor(random() * 9),
        factor = choose([2, 3, 4]),
        answer = start * factor ** 3
      p.question.prompt = {
        before: "Le registre affiche ",
        highlight: `${start} → ${start * factor} → ${start * factor ** 2} → ?`,
        after: ". Quelle valeur manque ?",
      }
      const choices = [answer, answer + start, answer - factor, answer * factor]
      p.question.answers = p.question.answers.map((a, i) => ({ ...a, label: String(choices[i]) }))
      correct = String(answer)
      p.hint = `Compare les deux premières valeurs : le même facteur est appliqué à chaque étape.`
      p.explanation = {
        before: "La suite multiplie chaque valeur par ",
        highlight: String(factor),
        after: `. Le dernier terme est donc ${answer}.`,
      }
      p.clue = `Cadence restaurée : facteur ${factor}.`
    }
    if (p.roomId === "cafeteria") {
      const colors = ["rouge", "vert", "bleu", "jaune"]
      for (let i = 3; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[colors[i], colors[j]] = [colors[j], colors[i]]
      }
      p.question.prompt = {
        before: "Le signal répète ",
        highlight: `${colors[0]} → ${colors[1]} → ${colors[2]} → ${colors[0]}`,
        after: ". Quelle couleur vient ensuite ?",
      }
      p.question.answers = p.question.answers.map((a, i) => ({
        ...a,
        label: colors[i][0].toUpperCase() + colors[i].slice(1),
      }))
      correct = colors[1][0].toUpperCase() + colors[1].slice(1)
      p.hint = "Repère le motif de trois couleurs et recommence-le au second passage."
      p.explanation = {
        before: "Le motif est cyclique. Après ",
        highlight: colors[0],
        after: ` vient ${colors[1]}.`,
      }
      p.clue = `Signal synchronisé : ${colors.slice(0, 3).join(", ")}.`
    }
    if (p.roomId === "gaming") {
      const sample = choose([
        {
          code: "typeof null",
          answer: "object",
          why: "C’est une particularité historique de JavaScript.",
        },
        { code: "typeof []", answer: "object", why: "Les tableaux sont des objets en JavaScript." },
        {
          code: "typeof 42",
          answer: "number",
          why: "Une valeur numérique possède le type number.",
        },
        {
          code: 'typeof "G4"',
          answer: "string",
          why: "Une valeur entre guillemets est une chaîne de caractères.",
        },
        {
          code: "typeof undefined",
          answer: "undefined",
          why: "La valeur undefined possède son propre type.",
        },
      ])
      p.question.prompt = {
        before: "La console exécute ",
        highlight: sample.code,
        after: ". Quel texte renvoie-t-elle ?",
      }
      const answers = ["object", "number", "string", "undefined"]
      p.question.answers = p.question.answers.map((a, i) => ({ ...a, label: `« ${answers[i]} »` }))
      correct = `« ${sample.answer} »`
      p.hint =
        "Distingue la valeur affichée et le type retourné par typeof. Les tableaux font partie des objets."
      p.explanation = {
        before: sample.code + " renvoie ",
        highlight: sample.answer,
        after: ". " + sample.why,
      }
      p.clue = `Type identifié : ${sample.code} → ${sample.answer}.`
    }
    const factor = 2 + Math.floor(random() * 4),
      start = 3 + Math.floor(random() * 8),
      portA = 20 + Math.floor(random() * 60),
      portB = 10 + Math.floor(random() * 80),
      values = [1, 2, 3].map(() => 2 + Math.floor(random() * 6)),
      permissions = choose(["644", "640", "744", "750"]),
      memory = 24 + Math.floor(random() * 60)
    const base = {
      id: "escape:" + p.roomId,
      name: "",
      icon: "▤",
      room: p.roomId,
      position: DOCUMENT_POSITIONS[p.roomId],
      text: "",
    }
    const tasks: Record<string, PracticalTask> = {
      classroom: {
        kind: "code",
        language: "JavaScript",
        instruction:
          "Répare la fonction du registre. Retrouve les exemples manuscrits sur un bureau de la salle, puis complète la ligne manquante.",
        template:
          "function prochaineValeur(n) {\n    // Complète la ligne ci-dessous\n    ______\n}\n\nG4.registre.reparer(prochaineValeur);",
        placeholder: "return …;",
        accepted: ["return n * " + factor, "return " + factor + " * n"],
        document: {
          ...base,
          name: "Feuille du registre",
          text:
            "REGISTRE / EXEMPLES DE TRANSFORMATION\n" +
            start +
            " devient " +
            start * factor +
            "\n" +
            (start + 2) +
            " devient " +
            (start + 2) * factor +
            "\n" +
            (start + 4) +
            " devient " +
            (start + 4) * factor +
            "\n\nLa même opération est appliquée à chaque entrée. La fonction prend un nombre n et renvoie sa nouvelle valeur.",
        },
      },
      cafeteria: {
        kind: "pin",
        language: "Console réseau",
        instruction:
          "Rétablis la liaison réseau. Le ticket de maintenance est posé sur le comptoir du café. Reconstitue la clé du commutateur.",
        template:
          "G4-NET / COMMUTATEUR PRINCIPAL\nEtat : liaison verrouillée\nAuthentification : clé à 4 chiffres\n\n> unlock --key ____",
        placeholder: "Clé à 4 chiffres",
        accepted: [String(portA) + String(portB)],
        document: {
          ...base,
          name: "Ticket du technicien réseau",
          text:
            "MAINTENANCE / RÉFECTOIRE\nCanal A : " +
            portA +
            "\nCanal B : " +
            portB +
            "\n\nLa clé est la concaténation de A puis B. Conserve les deux chiffres de chaque canal.",
        },
      },
      gaming: {
        kind: "pin",
        language: "JavaScript / console",
        instruction:
          "Remets l’arcade en route. Un mémo sur le bureau indique les valeurs de sa clé. Exécute mentalement le programme et saisis le résultat.",
        template:
          "// Le mémo fournit la liste badges.\nconst cle = badges.map(n => n * " +
          factor +
          ').join("");\n\nconsole.log(cle);\n\nG4.arcade.unlock(____);',
        placeholder: "Résultat affiché par la console",
        accepted: [values.map((n) => n * factor).join("")],
        document: {
          ...base,
          name: "Mémo du programmeur",
          text:
            "ARCADE / DONNÉES DE SESSION\nconst badges = [" +
            values.join(", ") +
            '];\n\nmap transforme chaque nombre. join("") assemble les résultats, sans espace ni séparateur. La formule est sur la console de l’arcade.',
        },
      },
      cowork: {
        kind: "command",
        language: "Terminal Linux",
        instruction:
          "Rends le dossier du campus accessible aux bons utilisateurs. Retrouve la politique d’accès dans les archives du cowork, puis complète chmod.",
        template:
          "g4@campus:~/archives$ ls -ld projet-g4/\ndrwx------ projet-g4/\n\ng4@campus:~/archives$ chmod ____ projet-g4/",
        placeholder: "Permissions en notation octale",
        accepted: [permissions],
        document: {
          ...base,
          name: "Politique d’accès aux archives",
          text:
            "ARCHIVES / AUTORISATIONS\nPropriétaire : " +
            { 6: "lecture + écriture", 7: "lecture + écriture + exécution" }[
              Number(permissions[0]) as 6 | 7
            ] +
            "\nGroupe : " +
            { 4: "lecture", 5: "lecture + exécution" }[Number(permissions[1]) as 4 | 5] +
            "\nAutres : " +
            (permissions[2] === "4" ? "lecture" : "aucun accès") +
            "\n\nBarème : lecture = 4 ; écriture = 2 ; exécution = 1. Additionne les droits de chaque colonne.",
        },
      },
      amphitheater: {
        kind: "pin",
        language: "Console serveur",
        instruction:
          "Restaure la mémoire du serveur de l’amphi. Trouve la fiche d’inventaire sur une table du fond ; convertis son identifiant en base 10.",
        template:
          "G4-SRV / RECOVERY CONSOLE\nModule mémoire : non reconnu\nIdentifiant attendu : entier décimal\n\nrecovery> identify ____",
        placeholder: "Identifiant en base 10",
        accepted: [String(memory)],
        document: {
          ...base,
          name: "Fiche du module mémoire",
          text:
            "INVENTAIRE / MODULE DE L’AMPHI\nIdentifiant gravé : 0x" +
            memory.toString(16).toUpperCase() +
            "\n\nLa console attend la même valeur en décimal. En hexadécimal : A=10, B=11, C=12, D=13, E=14, F=15. Chaque rang vaut une puissance de 16.",
        },
      },
    }
    p.practical = tasks[p.roomId]
    p.title = {
      classroom: "Réparer le registre",
      cafeteria: "Reconnecter le réseau",
      gaming: "Déboguer l’arcade",
      cowork: "Déverrouiller les archives",
      amphitheater: "Restaurer le serveur",
    }[p.roomId]
    p.question.prompt = { before: p.practical.instruction, highlight: "", after: "" }
    p.hint = {
      classroom:
        "Cherche la feuille du registre sur le bureau du fond. Compare chaque entrée à sa sortie ; la ligne doit renvoyer n multiplié par le facteur commun.",
      cafeteria:
        "Le ticket sur le comptoir donne deux canaux. Assemble leurs deux valeurs dans l’ordre A, B, sans les additionner.",
      gaming:
        "Le mémo du bureau donne badges. Multiplie chaque valeur par le facteur du programme, puis accole les résultats sans séparateur.",
      cowork:
        "La politique d’accès se trouve sur la table du fond. Calcule trois sommes : propriétaire, groupe, autres. Lis-les dans cet ordre.",
      amphitheater:
        "La fiche sur une table du fond indique un nombre commençant par 0x. Multiplie le premier chiffre par 16, puis ajoute le second.",
    }[p.roomId]
    p.explanation = {
      before: "Le système a accepté ",
      highlight: p.practical.accepted[0],
      after: ". Le module est restauré.",
    }

    const answers = [...p.question.answers]
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[answers[i], answers[j]] = [answers[j], answers[i]]
    }
    p.question.answers = answers.map((a, i) => ({
      ...a,
      id: String.fromCharCode(97 + i),
      letter: String.fromCharCode(65 + i),
    }))
    p.correctAnswerId = p.question.answers.find((a) => a.label === correct)!.id
  }
  return result
}
export function freshCampaignSeed(previous?: string) {
  let seed = crypto.randomUUID()
  for (
    let i = 0;
    i < 8 &&
    JSON.stringify(campaignDeck(seed).map((p) => p.question)) ===
      JSON.stringify(campaignDeck(previous).map((p) => p.question));
    i++
  )
    seed = crypto.randomUUID()
  return seed
}
