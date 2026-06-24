# 0006 Login de admin por magic link (sobre a auth anônima)

## Status

Accepted

## Contexto

O ADR 0003 estabeleceu **auth anônima** para todos e **admin por
`profiles.role = 'admin'`**, descartando e-mail/senha "para o MVP" por causa do
atrito. Na prática isso amarra o admin a um dispositivo: virar admin é um
`UPDATE` manual no uuid da sessão anônima — que se perde ao limpar o storage e
não permite logar de outro lugar. Para operar os jogos **ao vivo** (lançar
placar e cartões em tempo real durante as partidas), o admin precisa de um login
real, **portável e seguro**, sem reintroduzir atrito para os usuários comuns.

## Decisão

Mantemos a auth anônima dos usuários (o ADR 0003 segue valendo) e **adicionamos
um login de admin por _magic link_** (e-mail OTP por link), via Supabase Auth:

- **Usuário comum** continua anônimo, sem cadastro — nada muda.
- **Admin** entra com o e-mail → recebe um link → a sessão passa a ser a do
  usuário daquele e-mail. `signInWithOtp({ email })` + `detectSessionInUrl` do
  supabase-js no retorno; **logout** volta para a sessão anônima.
- **A autorização não muda**: continua `profiles.role = 'admin'` + `is_admin()`
  na RLS. O login só dá **identidade portável**; quem concede poder é a role.
- **Sem cadastro público de admin**: a conta admin é pré-autorizada (o e-mail é
  promovido a admin uma vez, via `UPDATE`, como hoje). Login de e-mail não-admin
  cai em `role = 'user'` e não escreve nada oficial — a RLS barra.
- **Passwordless**: nada de senha para guardar/rotacionar.

## Consequências

- O admin opera de qualquer lugar, sem depender da sessão anônima de um device.
- A fronteira de segurança é a mesma de antes: RLS + `is_admin()`. O login não
  concede poder por si — promover o e-mail a admin continua sendo um ato
  explícito e manual.
- Passam a existir uma **config de painel** (provider de e-mail/magic link
  habilitado, _redirect URLs_) e a dependência de **entrega de e-mail** no
  momento do login — aceitável para **um** ator (o admin), não para o fluxo de
  usuário.
- Diverge do "sem e-mail/senha" do ADR 0003, **mas só para o admin**; a parte de
  usuário do 0003 fica intacta. Este ADR **estende** o 0003, não o substitui.
- O "jogo ao vivo" em si **não** exige mudança de schema: é uma linha de
  `official_results` com `locked = false` (placar + `cards`) que o motor ignora
  (ver `buildInput`) e o cliente exibe como overlay; "encerrar" vira
  `locked = true` e aí sobrepõe, como hoje. Decisão de apresentação, registrada
  no PR da feature — não num ADR próprio.

## Alternativas

- **E-mail + senha** — descartado: senha para guardar/rotacionar sem ganho real
  para um único admin.
- **Código OTP por e-mail** — segurança equivalente ao magic link; preferimos o
  link por ser um clique só.
- **Manter só o `UPDATE` manual no anônimo** — insuficiente: não é portável e se
  perde com o storage; inviável para operar ao vivo.
