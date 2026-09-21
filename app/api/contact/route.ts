import { Resend } from "resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { name, email, msg } = await request.json();

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof msg !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !msg.trim()
  ) {
    return Response.json(
      { ok: false, error: "Todos los campos son obligatorios." },
      { status: 400 }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return Response.json(
      { ok: false, error: "El email no tiene un formato válido." },
      { status: 400 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      to: process.env.CONTACT_TO_EMAIL!,
      from: process.env.CONTACT_FROM_EMAIL!,
      subject: `Nuevo mensaje de contacto — ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\n${msg}`,
    });

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "No se pudo enviar el mensaje. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
